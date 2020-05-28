import { Router } from "express";
import controller from "./equipment.controller";
import category from "./category.controller";
import tag from "./tag.controller";

const router = Router();

router.delete("/category/:id", category.removeOne);
router.get("/category", category.getMany);
router.get("/category/:id", category.getOne);
router.post("/category/", category.createOne);
router.put("/category/:id", category.updateOne);

router.delete("/tag/:id", tag.removeOne);
router.get("/tag", tag.getMany);
router.get("/tag/:id", tag.getOne);
router.post("/tag/", tag.createOne);
router.put("/tag/:id", tag.updateOne);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
