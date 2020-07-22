import { Router } from "express";
import controller from "./reservation.controller";

const router = Router();

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/equipment/:id", controller.reserveEquipment);
router.post("/equipment/:id", controller.reserveEquipment);
router.put("/:id", controller.updateOne);

export default router;
