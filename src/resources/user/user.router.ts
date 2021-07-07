import { Router, Request, Response, NextFunction } from "express";
import { error403 } from "../../utils/authorization";
import controller from "./user.controller";

const router = Router();

// authorization
router.use("/:id", (req: Request, res: Response, next: NextFunction) => {
  // lookups by ID only allowed by admins or self
  if (res.locals.user.id !== Number(req.params.id) && !res.locals.admin)
    return res.status(403).json(error403);
  next();
});

// Get collections by username
router.get("/:id/courses", controller.getCourses);
router.get("/:id/projects", controller.getProjects);

// user records
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
