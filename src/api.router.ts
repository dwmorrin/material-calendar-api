import { Router } from "express";
import backupRouter from "./utils/backup";
import categoryRouter from "./resources/category/category.router";
import courseRouter from "./resources/course/course.router";
import { debugRouter } from "./utils/debug";
import equipmentRouter from "./resources/equipment/equipment.router";
import eventRouter from "./resources/event/event.router";
import groupRouter from "./resources/group/group.router";
import locationRouter from "./resources/location/location.router";
import projectRouter from "./resources/project/project.router";
import reservationRouter from "./resources/reservation/reservation.router";
import rosterRouter from "./resources/roster/roster.router";
import sectionRouter from "./resources/section/section.router";
import semesterRouter from "./resources/semester/semester.router";
import tagRouter from "./resources/tag/tag.router";
import userRouter from "./resources/user/user.router";
import virtualWeekRouter from "./resources/virtualWeek/virtualWeek.router";
import { env } from "process";

const router = Router();

if (env.NODE_ENV === "development") router.use("/debug", debugRouter);

router.use("/backups", backupRouter);
router.use("/categories", categoryRouter);
router.use("/courses", courseRouter);
router.use("/equipment", equipmentRouter);
router.use("/events", eventRouter);
router.use("/groups", groupRouter);
router.use("/locations", locationRouter);
router.use("/projects", projectRouter);
router.use("/reservations", reservationRouter);
router.use("/rosters", rosterRouter);
router.use("/sections", sectionRouter);
router.use("/semesters", semesterRouter);
router.use("/tags", tagRouter);
router.use("/users", userRouter);
router.use("/virtual-weeks", virtualWeekRouter);

export default router;
