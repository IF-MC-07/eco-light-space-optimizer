import { Router } from "express";
import * as lightControlController from "../controllers/lightControlController.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", authenticate, requireRole(["admin"]), lightControlController.getAll);
router.get("/:id", authenticate, requireRole(["admin"]), lightControlController.getById);
router.post("/", authenticate, requireRole(["admin"]), lightControlController.create);
router.put("/:id", authenticate, requireRole(["admin"]), lightControlController.update);
router.patch("/:id/toggle", authenticate, requireRole(["admin"]), lightControlController.toggle);
router.delete("/:id", authenticate, requireRole(["admin"]), lightControlController.remove);

export default router;
