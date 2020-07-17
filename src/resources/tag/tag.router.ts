import { Router } from "express";
import controller from "./tag.controller";

const router = Router();

router.get("/", controller.getMany);
router.get("/category/:id", controller.getByCategory);
router.get("/subcategory/:id", controller.getBySubCategory);

export default router;
