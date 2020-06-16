import { Router } from "express";
import controller from "./category.controller";

const router = Router();

router.get("/", controller.getAll);

export default router;