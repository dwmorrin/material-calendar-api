import { Router } from "express";
import controller from "./reservation.controller";
import { numericId, sendResults } from "../../utils/crud";

const router = Router();

router.put("/cancel/:reservationId", controller.adminResponse);
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/exceptions", controller.getManyPendingAdminApproval);
router.put("/exceptions/:reservationId", controller.adminResponse);
router.get(`/${numericId}`, controller.getOne);
router.post("/", controller.createOne);
router.put("/equipment/:id", controller.reserveEquipment);
router.post("/equipment/:id", controller.reserveEquipment);
router.put("/:id", controller.updateOne);

router.use(sendResults);

export default router;
