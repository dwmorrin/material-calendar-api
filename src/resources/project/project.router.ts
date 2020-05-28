import { Router } from "express";
import controller from "./project.controller";

const router = Router();

router.get("/allotment/:id", controller.getOneLocationAllotment);
router.get("/groups", controller.getGroups);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
