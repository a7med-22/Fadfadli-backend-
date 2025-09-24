import jwt from "jsonwebtoken";

export const verifyToken = async ({ token, signature }) => {
  return jwt.verify(token, signature);
};
