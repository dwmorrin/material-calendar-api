import { Router } from "express";
import controller from "./event.controller";
import { lockHandler } from "./event.lock";
import { sendResults } from "../../utils/crud";
import eventImport from "./event.import";

const router = Router();

router.post("/getIds", controller.getManyById);
router.post("/bulk", controller.createMany);
router.post("/import", ...eventImport);
router.get("/range", controller.range);
router.post("/:id/lock", lockHandler);
router.post("/:id/unlock", lockHandler);
router.delete("/:id", controller.deleteOne);
router.get("/:id", controller.getOne);
router.put("/:id", controller.updateOne);
router.get("/", controller.getMany);
router.post("/", controller.createOne);

router.use(sendResults);

export default router;
