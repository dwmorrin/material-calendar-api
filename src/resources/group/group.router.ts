import { Router } from "express";
import controller from "./group.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get(`/user/:userId`, controller.getGroupsByUser);
router.get("/", controller.getGroups);
router.get("/project/:projectId", controller.getGroupsByProject);
router.post("/invitation/:invitationId", controller.createGroupFromInvitation);
router.get("/:groupId", controller.getOneGroup);
router.delete("/:groupId", controller.removeOneGroup);
router.put("/:groupId", controller.updateOne);

// Joining and Leaving Groups
router.post("/:groupId/invitation/:invitationId", controller.joinGroup);
router.delete("/:groupId/user/:userId/", controller.leaveGroup);

router.use(sendResults);

export default router;
