import { Router } from "express";
import controller from "./location.controller";

const router = Router();

router.get("/default", controller.getDefaultId);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
