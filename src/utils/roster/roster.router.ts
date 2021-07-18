import { Router } from "express";
import { sendResults } from "../crud";
import controller from "./roster.controller";
import importStack from "./roster.import";

const router = Router();

router.get("/", controller.getMany);
router.post("/import", importStack);

router.use(sendResults);

export default router;
