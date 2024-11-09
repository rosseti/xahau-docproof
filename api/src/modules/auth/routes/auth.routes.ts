import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateJWT } from "../middleware/authenticateJWT";

export const authRoutes = Router();

authRoutes.get("/me", authenticateJWT, AuthController.me);
