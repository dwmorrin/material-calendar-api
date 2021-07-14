import { Router } from "express";
import controller from "./roster.controller";
import importStack from "./roster.import";

const router = Router();

router.get("/", controller.getMany);
router.post("/import", importStack);

export default router;
