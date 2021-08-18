import { Router } from "express";
import controller from "./group.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/project/:projectId", controller.getGroupsByProject);
router.get("/user", controller.getGroupsByUser);
router.get("/:groupId", controller.getOneGroup);
router.put("/:groupId", controller.updateOneGroup);
router.delete("/:groupId", controller.removeOneGroup);
router.get("/", controller.getGroups);
router.post("/", controller.createOne);

/**
 * Projects are created when users invite other users to a group.
 * If any invitee rejects the invitation, the group is abandoned.
 * An inviter can also rescind the invitation and abandon the group.
 * (Abandon === soft delete)
 */
router.put("/:groupId/invitation", controller.updateInvite);
router.delete("/:groupId/invitation", controller.cancelInvite);
router.delete("/:groupId/user/:userId/", controller.leaveGroup);

router.use(sendResults);

export default router;
