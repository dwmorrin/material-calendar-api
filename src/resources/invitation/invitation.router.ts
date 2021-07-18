import { Router } from "express";
import controller from "./invitation.controller";
import { sendResults } from "../../utils/crud";

const router = Router();

router.get("/user/:userId", controller.getInvitations);
router.get(
  "/user/:userId/project/:projectId",
  controller.getInvitationsByProject
);
router.post("/", controller.createInvitations);
router.put("/:invitationId", controller.updateInvitation);
router.delete("/:invitationId", controller.removeInvitation);

router.use(sendResults);

export default router;
