import { Router } from "express";
import controller from "./semester.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/current", controller.getCurrent);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);
router.delete("/:id", controller.removeOne);

router.use(sendResults);

export default router;
