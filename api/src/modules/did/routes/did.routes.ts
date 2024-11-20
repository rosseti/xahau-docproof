import { Router } from "express";
import { DIDController } from "../controllers/DIDController";

export const didRoutes = Router();

didRoutes.get("/resolve/:did", DIDController.getDID);
