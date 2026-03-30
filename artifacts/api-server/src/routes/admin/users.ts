import { Router, type IRouter } from "express";
import { getAdminUsersController } from "../../controllers/admin-users-controller.js";
import { adminMiddleware } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/users", adminMiddleware, getAdminUsersController);

export default router;

