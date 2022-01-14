import { Router, Request, Response, NextFunction } from "express";
import { onNotAuthorized, NotAuthorized } from "../../utils/authorization";
import controller from "./user.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

// authorization
router.use("/:id", (req: Request, res: Response, next: NextFunction) => {
  // lookups by ID only allowed by admins or self
  if (res.locals.user.id !== Number(req.params.id) && !res.locals.admin)
    return next(NotAuthorized);
  next();
});

// Get collections by username
router.get("/:id/courses", controller.getCourses);
router.get("/:id/projects", controller.getProjects);

// Reset user password
router.put("/:id/reset", controller.resetPassword);

// user records
router.post("/bulk", controller.import);
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

router.use(sendResults);
router.use(onNotAuthorized);

export default router;
