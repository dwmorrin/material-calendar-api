import { Router } from "express";
import controller from "./location.controller";
import bulkImport from "./location.import";
import { numericId, sendResults } from "../../utils/crud";

const router = Router();

router.get("/default", controller.getDefaultId);

router.get(`/${numericId}/virtualweeks`, controller.getVirtualWeeks);
router.post(`/${numericId}/hours/bulk`, controller.createOrUpdateHours);

// sums the hours of the events scheduled in a location
router.get(`/${numericId}/hours`, controller.sumHours);

router.delete(`/${numericId}`, controller.removeOne);
router.get("/", controller.getMany);
router.get(`/${numericId}`, controller.getOne);
router.post("/", controller.createOne);
router.post("/bulk", bulkImport);
router.put(`/${numericId}`, controller.updateOne);

router.use(sendResults);

export default router;
