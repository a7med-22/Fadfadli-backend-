import jwt from "jsonwebtoken";

export const generateToken = async ({ payload, signature, options }) => {
  return jwt.sign(payload, signature, options);
};
