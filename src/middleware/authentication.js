import revokeTokenModel from "../DB/models/token-revoke.model.js";
import userModel from "../DB/models/user.model.js";
import { verifyToken } from "../utils/token/verifyToken.js";

export const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const [prefix, token] = authorization?.split(" ") || [];

    let signature = "";

    if (!prefix || !token) {
      throw new Error("token not exist", { cause: 401 });
    }

    if (prefix.toLowerCase() === process.env.BEARER_USER) {
      signature = process.env.ACCESS_TOKEN_USER;
    } else if (prefix.toLowerCase() === process.env.BEARER_ADMIN) {
      signature = process.env.ACCESS_TOKEN_ADMIN;
    } else {
      throw new Error("Invalid token prefix", { cause: 401 });
    }

    const decodedUser = await verifyToken({ token, signature });

    const isRevoked = await revokeTokenModel.findOne({
      tokenId: decodedUser.jti,
    });
    if (isRevoked) {
      throw new Error("Logged out. Please log in again.", { cause: 401 });
    }

    // check user exist in database or not , it could be deleted
    const user = await userModel.findById(decodedUser.id, {
      __v: 0,
    });
    if (!user) {
      throw new Error("user not exist", { cause: 404 });
    }

    if (!user.confirmed) {
      throw new Error("Account not confirmed. Please verify your email.", {
        cause: 403,
      });
    }

    req.user = user;
    req.decodedUser = decodedUser;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid token", { cause: 401 }));
    }
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired", { cause: 401 }));
    }

    // forward original error if it's a custom one
    return next(error);
  }
};
