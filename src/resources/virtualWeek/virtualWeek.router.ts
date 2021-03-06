import { Router } from "express";
import controller from "./virtualWeek.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);
router.put("/:id/join", controller.joinTwo);
router.put("/:id/split", controller.splitOne);

router.use(sendResults);

export default router;
