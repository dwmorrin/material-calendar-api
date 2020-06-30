import { Router } from "express";
import controller from "./semester.controller";

const router = Router();

router.get("/current", controller.getCurrent);
router.get("/", controller.getMany);

export default router;
