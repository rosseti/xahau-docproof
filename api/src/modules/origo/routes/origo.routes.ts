import { Router } from "express";
import { OrigoController } from "../controllers/OrigoController";
import { authenticateJWT } from "../../auth/middleware/authenticateJWT";

export const origoRoutes = Router();

const signer = require("node-signpdf").default;

import multer from "multer";

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    "application/pdf",
    "application/x-pdf",
    "application/octet-stream",
    "application/x-pkcs12",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only file types are allowed"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});

origoRoutes.post(
  "/verify-signature",
  (OrigoController.verifySignature as any)
);