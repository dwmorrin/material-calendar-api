import { Router } from "express";
import controller from "./tag.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/", controller.getMany);
router.get("/category/:id", controller.getByCategory);
router.get("/subcategory/:id", controller.getBySubCategory);

router.use(sendResults);

export default router;
