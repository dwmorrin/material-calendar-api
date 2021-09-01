import { Router } from "express";
import controller from "./location.controller";
import bulkImport from "./location.import";
import { numericId, sendResults } from "../../utils/crud";

const router = Router();

router.post(`/${numericId}/hours/bulk`, controller.bulkLocationHours);

router.delete(`/${numericId}`, controller.removeOne);
router.get("/", controller.getMany);
router.get(`/${numericId}`, controller.getOne);
router.post("/", controller.createOne);
router.post("/bulk", bulkImport);
router.put(`/${numericId}`, controller.updateOne);

router.use(sendResults);

export default router;
