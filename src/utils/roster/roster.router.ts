import { Router } from "express";
import { numericId, sendResults } from "../crud";
import controller from "./roster.controller";
import importStack from "./roster.import";

const router = Router();

router.get("/", controller.getMany);
router.post("/import", importStack);
router.put(`/${numericId}`, controller.updateOne);

router.use(sendResults);

export default router;
