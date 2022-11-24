import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { Client } from 'pg';
import { v4 } from 'uuid';
import { keyBy } from 'lodash';

import { Cart } from '../models';
import { dbOptions } from 'src/shared/db';
import {
  cartItemsQuery,
  cartQuery,
  deleteCartItemQuery,
  getDeleteCartItemByProductIdsQuery,
  insertCartItemQuery,
  insertCartQuery,
} from './sql';

@Injectable()
export class CartService {
  private dbClient;
  private lambda;

  constructor() {
    this.dbClient = new Client(dbOptions);
    this.lambda = new AWS.Lambda();
  }

  async findByUserId(userId: string): Promise<Cart> {
    try {
      await this.dbClient.connect();

      const values = [userId];

      const cartId: string = (await this.dbClient.query(cartQuery, values))?.rows?.[0]
        ?.id;
      if (!cartId) return undefined;

      const valuesItems = [cartId];

      const items: { product_id: string; count: number }[] = (
        await this.dbClient.query(cartItemsQuery, valuesItems)
      )?.rows;

      const { Payload } = await this.lambda
        .invoke({
          FunctionName: process.env.GET_PRODUCT_LIST_LAMBDA_ARN,
        })
        .promise();

      const { body } = JSON.parse(Payload as string);
      const productList: {
        id: string;
        title: string;
        description: string;
        price: number;
        count: number;
      }[] = JSON.parse(body);

      const productsById = keyBy(productList, 'id');

      return {
        id: cartId,
        items: items.length
          ? items.map(item => ({
            product: productsById[item.product_id],
            count: item.count,
          }))
          : [],
      };
    } catch (e) {
      throw {message: e, code: 502};
    } finally {
      this.dbClient.end();
    }
  }

  async createByUserId(userId: string) {
    const dbClient = new Client(dbOptions);
    try {
      await dbClient.connect();

      const id = v4();
      const date = new Date().toISOString();
      const values = [id, userId, date, date];

      await dbClient.query(insertCartQuery, values);

      return await this.findByUserId(userId);
    } catch (e) {
      throw {message: e, code: 502};
    } finally {
      dbClient.end();
    }
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return await this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const dbClient = new Client(dbOptions);
    try {
      await dbClient.connect();

      const { id: cartId, ...rest } = await this.findOrCreateByUserId(userId);

      const updatedCart = {
        id: cartId,
        ...rest,
        items: [...items],
      };

      const productIdsForDelete = updatedCart.items.map(
        item => `'${item.product.id}'`,
      );

      const valuesDelete = [cartId];
      await dbClient.query(getDeleteCartItemByProductIdsQuery(productIdsForDelete), valuesDelete);

      const valuesInsert = [cartId];
      await dbClient.query(insertCartItemQuery(updatedCart), valuesInsert);

      return await this.findByUserId(userId);
    } catch (e) {
      throw {message: e, code: 502};
    } finally {
      dbClient.end();
    }
  }

  async removeByUserId(userId): Promise<void> {
    const dbClient = new Client(dbOptions);
    try {
      await dbClient.connect();

      const valuesFind = [userId];

      const { id: cartId } = (
        await dbClient.query(cartQuery, valuesFind)
      )?.rows?.[0];
      if (!cartId) return;

      const valuesDeleteCartItem = [cartId];

      await dbClient.query(deleteCartItemQuery, valuesDeleteCartItem);
    } catch (e) {
      throw {message: e, code: 502};
    } finally {
      dbClient.end();
    }
  }

}
