import Joi from "joi";
import { generalRules } from "../../utils/generalRules/index.js";
import { fileTypes } from "../../utils/multer/local.multer.js";
import { createCompleteSchema } from "../../utils/validation.js";

export const sendMessageSchema = createCompleteSchema({
  params: Joi.object({
    receiverId: generalRules.id.required(),
  }).required(),

  body: Joi.object({
    content: Joi.string().trim().min(2).max(200000),
  }),

  files: Joi.array()
    .items(
      Joi.object({
        fieldname: generalRules.file.fieldname.valid("attachments").required(),
        originalname: generalRules.file.originalname.required(),
        encoding: generalRules.file.encoding.required(),
        mimetype: generalRules.file.mimetype.valid(
          ...Object.values(fileTypes.image)
        ),
        // for local only
        // filePath: generalRules.file.filePath.required(),
        destination: generalRules.file.destination.required(),
        filename: generalRules.file.filename.required(),
        path: generalRules.file.path.required(),
        size: generalRules.file.size.required(),
      })
    )
    .min(0)
    .max(2),
});
