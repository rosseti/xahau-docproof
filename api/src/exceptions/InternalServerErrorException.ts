import { HttpException } from "./HttpException";

export class InternalServerErrorException extends HttpException {
  constructor(message = "Internal server error") {
    super(500, message);
  }
}
