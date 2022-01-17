import { Router } from "express";
import controller from "./section.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.post("/bulk", controller.importSections);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);
router.delete("/:id", controller.deleteOne);

router.use(sendResults);

export default router;
