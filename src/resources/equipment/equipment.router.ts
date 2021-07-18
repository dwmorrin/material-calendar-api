import { Router } from "express";
import controller from "./equipment.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/category/:id", controller.getByCategory);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

router.use(sendResults);

export default router;
