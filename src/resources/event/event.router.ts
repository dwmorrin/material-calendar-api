import { Router } from "express";
import controller from "./event.controller";
import { sendResults } from "../../utils/crud";
import eventImport from "./event.import";

const router = Router();

router.post("/getIds", controller.getManyById);
router.post("/bulk", controller.createMany);
router.post("/import", ...eventImport);
router.get("/range", controller.range);
router.post("/:id/lock", controller.lockOne);
router.post("/:id/unlock", controller.unlockOne);
router.delete("/:id", controller.deleteOne);
router.get("/:id", controller.getOne);
router.put("/:id", controller.updateOne);
router.get("/", controller.getMany);
router.post("/", controller.createOne);

router.use(sendResults);

export default router;
