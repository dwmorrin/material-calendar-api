import { RequestHandler } from "express";
import { Router } from "express";
import { numericId, sendResults } from "../../utils/crud";
import controller from "./roster.controller";
import importStack from "./roster.import";

const router = Router();

router.get("/", controller.getMany);
router.post("/", controller.createOne as unknown as RequestHandler);
router.post("/bulk", importStack);
router.put(`/${numericId}`, controller.updateOne as unknown as RequestHandler);
router.delete(`/${numericId}`, controller.deleteOne);

router.use(sendResults);

export default router;
