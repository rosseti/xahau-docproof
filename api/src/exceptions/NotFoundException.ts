import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}
