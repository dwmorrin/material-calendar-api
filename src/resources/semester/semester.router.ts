import { Router } from "express";
import controller from "./semester.controller";
import { numericId, sendResults } from "../../utils/crud";

const router = Router();

router.get("/active", controller.getActive);
router.get("/current", controller.getCurrent);
router.get("/", controller.getMany);
router.get(`/${numericId}`, controller.getOne);
router.post("/", controller.createOne);
router.put(`/${numericId}`, controller.updateOne);
router.delete(`/${numericId}`, controller.removeOne);

router.use(sendResults);

export default router;
