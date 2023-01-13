import { Router } from "express";
import controller from "./reservation.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.post("/forward", controller.forwardOne);
router.delete("/forward", controller.forwardRemoveOne);
router.post("/import-class-meetings", controller.importClassMeetings);
router.put("/admin/exceptions/refund/:id", controller.refund);
router.put("/cancel", controller.cancelManyReservations);
router.put("/cancel/:id", controller.cancelReservation);
router.get("/user", controller.getByUser);
router.get("/:id", controller.getOne);
router.put("/:id", controller.updateOne);
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.post("/", controller.createOne);

router.use(sendResults);

export default router;
