import { Router } from "express";
import controller from "./project.controller";

const router = Router();

router.get("/:id/invitations/:user_id", controller.getInvitations);
router.post("/:id/invitations", controller.createInvitations);
router.put("/invitations/:invitation_id", controller.updateInvitation);
router.delete("/invitations/:invitation_id", controller.removeInvitation);

router.get("/:id/allotments", controller.getOneLocationAllotment);
router.put("/:id/allotments", controller.updateAllotment);
router.get("/:id/groups", controller.getGroupsByProject);
router.get("/:id/users", controller.getUsersByProject);

router.delete("/:id", controller.removeOne);
router.get("/", controller.getMany);
router.get("/:id", controller.getOne);
router.post("/", controller.createOne);
router.put("/:id", controller.updateOne);

export default router;
