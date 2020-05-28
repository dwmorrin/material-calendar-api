import { Router } from "express";
import controller from "./user.controller";

const router = Router();

router.get("/groups", controller.getGroups);
router.get("/groups/:id", controller.getOneGroup);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;