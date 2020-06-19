import { Router } from "express";
import controller from "./equipment.controller";

const router = Router();

router.get("/tags?", controller.getTags);
router.get("/categor*", controller.getCategories);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/category/:id", controller.getByCategory);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
