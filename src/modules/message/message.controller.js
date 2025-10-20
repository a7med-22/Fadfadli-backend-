import { Router } from "express";
import { authentication } from "../../middleware/authentication.js";
import { validation } from "../../middleware/validation.js";
import { cloudFileUpload } from "../../utils/multer/cloud.multer.js";
import { fileTypes } from "../../utils/multer/local.multer.js";
import * as MC from "./message.service.js";
import * as MV from "./message.validation.js";

const messageRouter = Router();

messageRouter.post(
  "/:receiverId",
  cloudFileUpload({ typeNeeded: fileTypes.image }).array("attachments", 2),
  validation(MV.sendMessageSchema),
  MC.sendMessage
);

messageRouter.post(
  "/:receiverId/sender",
  authentication,
  cloudFileUpload({ typeNeeded: fileTypes.image }).array("attachments", 2),
  validation(MV.sendMessageSchema),
  MC.sendMessage
);

export default messageRouter;
