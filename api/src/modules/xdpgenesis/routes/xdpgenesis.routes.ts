import { Router } from "express";
import { XDPGenesisController } from "../controllers/XDPGenesisController";
import { authenticateJWT } from "../../auth/middleware/authenticateJWT";

export const authRoutes = Router();

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

authRoutes.post(
  "/sign",
  (authenticateJWT as any),
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cert", maxCount: 1 },
  ]) as any,
  (XDPGenesisController.sign as any)
);
