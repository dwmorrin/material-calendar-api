import { Router } from "express";
import controller from "./course.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.post("/bulk", controller.importCourses);
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

router.use(sendResults);

export default router;
