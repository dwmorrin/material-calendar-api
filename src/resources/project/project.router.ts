import { Router } from "express";
import controller from "./project.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/:id/allotments", controller.getOneLocationAllotment);
router.put("/:id/allotments", controller.updateAllotment);
router.get("/:id/users", controller.getUsersByProject);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

router.use(sendResults);

export default router;
