import { APIGatewayEvent } from 'aws-lambda';
import { CartController } from 'src/cart/cart.controller';
import { CartService } from 'src/cart';
import { OrderService } from 'src/order';
import { AppRequest } from 'src/shared';
import { errorResponse, successResponse } from 'src/utils/apiResponseBuilder';

export const clearUserCart = async (event: APIGatewayEvent) => {
  try {
    const { userId } = event.pathParameters;

    const cartController = new CartController(
      new CartService(),
      new OrderService(),
    );

    const obj = {
      user: {
        id: userId,
      },
    } as AppRequest;

    await cartController.clearUserCart(obj);

    return successResponse(obj);
  } catch (e) {
    return errorResponse(e);
  }
};