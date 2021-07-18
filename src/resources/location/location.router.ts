import { Router } from "express";
import controller from "./location.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/default", controller.getDefaultId);

router.get("/:id/virtualweeks", controller.getVirtualWeeks);
router.post("/:id/hours/bulk", controller.createOrUpdateHours);

// sums the hours of the events scheduled in a location
router.get("/:id/hours", controller.sumHours);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

router.use(sendResults);

export default router;
