import Joi from "joi";
import { Types } from "mongoose";

export const customValidationId = (value, helper) => {
  const data = Types.ObjectId.isValid(value);
  return data ? value : helper.message("Invalid ID");
};

export const generalRules = {
  id: Joi.string().custom(customValidationId),
  name: Joi.string().min(2).max(20).messages({
    "string.min": "min name length is 2 char",
    "any.required": "name is mandatory",
  }),
  email: Joi.string().email({
    minDomainSegments: 2,
    maxDomainSegments: 3,
    tlds: { allow: ["net", "com"] },
  }),
  password: Joi.string().pattern(
    new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
  ),
  confirmPassword: Joi.string().valid(Joi.ref("password")),
  phone: Joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
  otp: Joi.string().length(6),

  headers: Joi.object({
    authorization: Joi.string().required(),
    "user-agent": Joi.string().required(),
    accept: Joi.string().required(),
    host: Joi.string().required(),
    "content-length": Joi.string(),
    "content-type": Joi.string(),
  }),

  file: {
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    filePath: Joi.string().required(),
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required(),
    size: Joi.number().positive().required(),
  },
};
