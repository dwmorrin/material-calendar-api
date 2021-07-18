import { Router } from "express";
import controller from "./group.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/", controller.getGroups);
router.get("/:groupId", controller.getOneGroup);
router.get("/user/:userId", controller.getGroupsByUser);
router.get("/project/:projectId", controller.getGroupsByProject);
router.delete("/:groupId", controller.removeOneGroup);
router.post("/invitation/invitationId", controller.createGroupFromInvitation);

// Joining and Leaving Groups
router.post("/:groupId/invitation/:invitationId", controller.joinGroup);
router.delete("/:groupId/user/:userId/", controller.leaveGroup);

router.use(sendResults);

export default router;
