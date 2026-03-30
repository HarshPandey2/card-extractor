import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import extractRouter from "./extract.js";
import cardsRouter from "./cards.js";
import adminAuthRouter from "./admin/auth.js";
import adminCardsRouter from "./admin/cards.js";
import adminUsersRouter from "./admin/users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(extractRouter);
router.use(cardsRouter);
router.use(adminAuthRouter);
router.use(adminCardsRouter);
router.use(adminUsersRouter);

export default router;
