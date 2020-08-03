import { Router } from "express";
import controller from "./event.controller";

const router = Router();

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.post("/bulk", controller.createOrUpdateMany);
router.put("/:id", controller.updateOne);

export default router;
