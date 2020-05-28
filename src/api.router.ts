import { Router } from "express";
import equipmentRouter from "./resources/equipment/equipment.router";
import eventRouter from "./resources/event/event.router";
import locationRouter from "./resources/location/location.router";
import projectRouter from "./resources/project/project.router";
import reservationRouter from "./resources/reservation/reservation.router";
import userRouter from "./resources/user/user.router";

const router = Router();

router.use("/equipment", equipmentRouter);
router.use("/events", eventRouter);
router.use("/locations", locationRouter);
router.use("/projects", projectRouter);
router.use("/reservations", reservationRouter);
router.use("/users", userRouter);

export default router;
