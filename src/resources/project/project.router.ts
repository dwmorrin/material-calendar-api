import { Router } from "express";
import controller from "./project.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.post("/location-hours", controller.createLocationHours);

router.get("/:id/allotments", controller.getOneLocationAllotment);
router.put("/:id/allotments", controller.updateAllotment);
router.get("/:id/group-dashboard", controller.getGroupDashboard);

router.delete("/:id", controller.removeOne);
router.get("/:id", controller.getOne);
router.put("/:id", controller.updateOne);
router.get("/", controller.getMany);
router.post("/", controller.createOne);

router.use(sendResults);

export default router;
