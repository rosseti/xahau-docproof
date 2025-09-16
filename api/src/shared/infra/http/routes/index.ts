import { Router } from "express";

import { authRoutes } from "@/modules/auth/routes/auth.routes";
import { docRoutes } from "@/modules/documents/routes/document.routes";
import { didRoutes } from "@/modules/did/routes/did.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/doc", docRoutes);
router.use("/did", didRoutes);
router.use("/xdp-genesis", require("@/modules/xdpgenesis/routes/xdpgenesis.routes").authRoutes);

export { router };
