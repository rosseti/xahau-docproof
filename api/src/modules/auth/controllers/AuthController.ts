import { AuthRequest } from "@/shared/types/AuthRequest";
import { Response } from "express";

export class AuthController {
  static async me(req: AuthRequest, res: Response): Promise<any> {
    return res.json({
      status: "ok",
      user: req.user,
    });
  }
}
