import { APIGatewayEvent } from 'aws-lambda';
import { CartController } from 'src/cart/cart.controller';
import { CartService } from 'src/cart';
import { OrderService } from 'src/order';
import { AppRequest } from 'src/shared';
import { errorResponse, successResponse } from 'src/utils/apiResponseBuilder';

export const checkout = async (event: APIGatewayEvent) => {
  try {
    const { userId } = event.pathParameters;
    const data: {
      comments: string;
      paymentType: string;
      paymentAddress?: any;
      paymentCreditCard?: any;
      deliveryType: string;
      deliveryAddress: string;
    } = JSON.parse(event.body);

    const cartController = new CartController(
      new CartService(),
      new OrderService(),
    );

    const { data: res } = await cartController.checkout(
      {
        user: {
          id: userId,
        },
      } as AppRequest,
      {
        comments: data.comments,
        payment: JSON.stringify({
          type: data.paymentType,
          address: data.paymentAddress,
          creditCard: data.paymentCreditCard,
        }),
        delivery: JSON.stringify({
          type: data.deliveryType,
          address: data.deliveryAddress,
        }),
      },
    );

    return successResponse(res);
  } catch (e) {
    return errorResponse(e);
  }
};