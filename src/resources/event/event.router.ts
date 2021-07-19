import { Router } from "express";
import controller from "./event.controller";
import { sendResults } from "../../utils/crud";
import eventImport from "./event.import";

const router = Router();

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.post("/bulk", controller.createMany);
router.put("/:id", controller.updateOne);
// bulk route already exists
router.post("/import", eventImport);

router.use(sendResults);

export default router;
