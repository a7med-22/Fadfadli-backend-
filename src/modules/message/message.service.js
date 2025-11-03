import messageModel from "../../DB/models/message.model.js";
import userModel, { activeUser } from "../../DB/models/user.model.js";
import { uploadFiles } from "../../utils/multer/cloudinary.js";
import { successResponse } from "../../utils/response.js";

export const sendMessage = async (req, res, next) => {
  if (!req.body.content && (!req.files || req.files.length === 0)) {
    throw new Error(
      "Either content or attachments are required to send a message",
      { cause: 400 }
    );
  }
  const { receiverId } = req.params;

  if (
    !(await userModel.findOne({
      _id: receiverId,
      ...activeUser,
    }))
  ) {
    throw new Error("recipient not found", { cause: 404 });
  }

  const { content } = req.body;
  let attachments = [];

  if (req.files?.length) {
    attachments = await uploadFiles({
      files: req.files,
      filePath: `messages/${receiverId}`,
    });
  }

  const message = await messageModel.create({
    content,
    attachments,
    receiverId,
    senderId: req.user?._id,
  });

  return successResponse({
    res,
    status: 201,
    data: message,
    message: "Message sent successfully",
  });
};
