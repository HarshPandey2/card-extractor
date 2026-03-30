import { Router, type IRouter } from "express";
import { adminLoginController } from "../../controllers/admin-auth-controller.js";

const router: IRouter = Router();

router.post("/admin/login", adminLoginController);

export default router;

