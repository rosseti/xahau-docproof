import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "@/shared/types/AuthRequest";
import { Xumm } from "xumm";
import { rsaPublicKey } from "./jwk";
const jwt = require("jsonwebtoken");

const secretKey = process.env.XAMAN_SECRET_KEY || "secret";

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: "Token not provided" });
  }
  
  const [type, token] = authorizationHeader.split(" ");
  console.log(token);

  const pubKey = rsaPublicKey;

  if (type !== "Bearer") {
    return res.status(401).json({ error: "Invalid token type" });
  }

  try {
    const user = await jwt.verify(token, pubKey);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

