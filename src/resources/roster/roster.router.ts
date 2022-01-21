import { Router } from "express";
import { numericId, sendResults } from "../../utils/crud";
import controller from "./roster.controller";
import importStack from "./roster.import";

const router = Router();

router.post("/new-roster-import", controller.importRoster);
router.post("/bulk", importStack);
router.put(`/${numericId}`, controller.updateOne);
router.delete(`/${numericId}`, controller.deleteOne);
router.get("/", controller.getMany);
router.post("/", controller.createOne);

router.use(sendResults);

export default router;
