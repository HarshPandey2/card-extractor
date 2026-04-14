import { Router, type IRouter } from "express";
import {
  deleteAdminCardController,
  exportAdminCardsController,
  getAdminCardsController,
} from "../../controllers/admin-cards-controller.js";
import { adminMiddleware } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/cards", adminMiddleware, getAdminCardsController);
router.get("/admin/cards/export", adminMiddleware, exportAdminCardsController);
router.delete("/admin/card/:id", adminMiddleware, deleteAdminCardController);

export default router;

