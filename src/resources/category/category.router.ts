import { Router } from "express";
import { sendResults } from "../../utils/crud";
import controller from "./category.controller";

const router = Router();

router.get("/", controller.getMany);

router.use(sendResults);

export default router;
