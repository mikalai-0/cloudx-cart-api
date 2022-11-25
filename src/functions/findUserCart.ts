import { APIGatewayEvent } from 'aws-lambda';
import { CartController } from 'src/cart/cart.controller';
import { CartService } from 'src/cart';
import { OrderService } from 'src/order';
import { AppRequest } from 'src/shared';
import { errorResponse, successResponse } from 'src/utils/apiResponseBuilder';

export const findUserCart = async (event: APIGatewayEvent) => {
  try {
    const { userId } = event.pathParameters;

    const cartController = new CartController(
      new CartService(),
      new OrderService(),
    );

    const { data } = await cartController.findUserCart({
      user: {
        id: userId,
      },
    } as AppRequest);

    return successResponse(data);
  } catch (e) {
    return errorResponse(e);
  }
};