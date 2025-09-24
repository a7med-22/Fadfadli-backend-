import Joi from "joi";
import { userGender } from "../../DB/models/user.model.js";
import { generalRules } from "../../utils/generalRules/index.js";

// Helper function to create complete validation schemas
const createCompleteSchema = (schemaObject) => {
  return {
    body: schemaObject.body || Joi.object({}).unknown(false),
    params: schemaObject.params || Joi.object({}).unknown(false),
    query: schemaObject.query || Joi.object({}).unknown(false),
    headers: schemaObject.headers || Joi.object({}).unknown(true), // Allow other headers like user-agent
  };
};

export const signupSchema = createCompleteSchema({
  body: Joi.object({
    name: generalRules.name.required(),
    email: generalRules.email.required(),
    password: generalRules.password.required(),
    age: Joi.number().integer().positive().min(18).max(100).required(),
    gender: Joi.string()
      .valid(...Object.values(userGender))
      .required(),
    phone: generalRules.phone.required(),
    cPassword: generalRules.confirmPassword.required().messages({
      "any.only": "Password and confirm password must match",
    }),
    BD: Joi.string(),
  }).required(),
});

export const signinSchema = createCompleteSchema({
  body: Joi.object({
    email: generalRules.email.required(),
    password: Joi.string().min(1).required().messages({
      "string.min": "Password is required",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty"
    }),
  }).required(),
});

export const updatePasswordSchema = createCompleteSchema({
  body: Joi.object({
    oldPassword: generalRules.password.required(),
    password: generalRules.password.required(),
    cPassword: generalRules.confirmPassword.required().messages({
      "any.only": "New password and confirm password must match",
    }),
  }).required(),
  headers: generalRules.headers,
});

export const forgetPasswordSchema = createCompleteSchema({
  body: Joi.object({
    email: generalRules.email.required(),
  }).required(),
});
export const resetPasswordSchema = createCompleteSchema({
  body: Joi.object({
    email: generalRules.email.required(),
    otp: generalRules.otp.required(),
    password: generalRules.password.required(),
    cPassword: generalRules.confirmPassword.required().messages({
      "any.only": "New password and confirm password must match",
    }),
  }).required(),
});

export const updateProfileSchema = createCompleteSchema({
  body: Joi.object({
    name: generalRules.name,
    email: generalRules.email,
    age: Joi.number().integer().positive().min(10).max(100),
    gender: Joi.string().valid(...Object.values(userGender)),
    phone: generalRules.phone,
  }),
  headers: generalRules.headers,
});

export const getProfileSchema = createCompleteSchema({
  params: Joi.object({
    id: generalRules.id.required(),
  }).required(),
  headers: generalRules.headers,
});

export const freezeAccountSchema = createCompleteSchema({
  params: Joi.object({
    id: generalRules.id,
  }),
  headers: generalRules.headers,
});

export const unfreezeAccountSchema = freezeAccountSchema;

export const signupWithGmailSchema = createCompleteSchema({
  body: Joi.object({
    idToken: Joi.string().required(),
  }).required(),
});

export const signinWithGmailSchema = signupWithGmailSchema;

export const signupAndSigninWithGmailSchema = signupWithGmailSchema;

// Additional schemas for other endpoints
export const logoutSchema = createCompleteSchema({
  headers: generalRules.headers,
});

export const refreshTokenSchema = createCompleteSchema({
  headers: generalRules.headers,
});

export const confirmEmailSchema = createCompleteSchema({
  params: Joi.object({
    token: Joi.string().required(),
  }).required(),
});

export const getProfilePublicSchema = createCompleteSchema({
  headers: generalRules.headers,
});
