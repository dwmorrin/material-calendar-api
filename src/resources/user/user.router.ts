import { Router } from "express";
import controller from "./user.controller";

const router = Router();

// User Groups
router.get("/groups", controller.getGroups);
router.get("/groups/:id", controller.getOneGroup);
router.post("/groups/:invitation_id", controller.createGroup);
router.delete("/groups/:groupId", controller.removeOneGroup);

// Joining Groups
router.post("/groups/:groupId/invitation/:invitation_id", controller.joinGroup);
router.delete("/:id/groups/:groupId/", controller.leaveGroup);

// Get collections by username
router.get("/:id/courses", controller.getCourses);
router.get("/:id/groups", controller.getGroupsForOne);
router.get("/:id/projects", controller.getProjects);

// user records
router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
