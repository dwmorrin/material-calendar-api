import { Router } from "express";
import controller from "./semester.controller";

const router = Router();

router.get("/current", controller.getCurrent);

export default router;
