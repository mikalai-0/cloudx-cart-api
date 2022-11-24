import { APIGatewayEvent } from 'aws-lambda';
import { CartController } from 'src/cart/cart.controller';
import { Cart, CartService } from 'src/cart';
import { OrderService } from 'src/order';
import { AppRequest } from 'src/shared';
import { errorResponse, successResponse } from 'src/utils/apiResponseBuilder';

export const updateUserCart = async (event: APIGatewayEvent) => {
  try {
    const { userId } = event.pathParameters;
    const data: Cart = JSON.parse(event.body);

    if (!data || !data.items || !data.items.length) {
      return errorResponse({message: 'Invalid items', name: 'Bad Request'}, 400);
    }

    const cartController = new CartController(
      new CartService(),
      new OrderService(),
    );

    const { data: res } = await cartController.updateUserCart(
      {
        user: {
          id: userId,
        },
      } as AppRequest,
      data,
    );

    return successResponse(res);
  } catch (e) {
    return errorResponse(e);
  }
};