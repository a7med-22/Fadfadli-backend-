import { Router } from "express";
import { userRoles } from "../../DB/models/user.model.js";
import { authentication } from "../../middleware/authentication.js";
import { authorization } from "../../middleware/authorization.js";
import { validation } from "../../middleware/validation.js";
import { localFileUpload } from "../../utils/multer/local.multer.js";
import * as UC from "./user.service.js";
import * as UV from "./user.validation.js";

const userRouter = Router();

// =====auth with system======
userRouter.post("/signup", validation(UV.signupSchema), UC.signup);
userRouter.post("/signin", validation(UV.signinSchema), UC.signIn);

// =====auth with gmail======
userRouter.post(
  "/signupWithGmail",
  validation(UV.signupWithGmailSchema),
  UC.signupWithGmail
);
userRouter.post(
  "/signinWithGmail",
  validation(UV.signinWithGmailSchema),
  UC.signInWithGmail
);
userRouter.post(
  "/signupAndSigninWithGmail",
  validation(UV.signupAndSigninWithGmailSchema),
  UC.signupAndSigninWithGmail
);

// ========email confirmation=======
userRouter.get(
  "/confirmEmail/:token",
  validation(UV.confirmEmailSchema),
  UC.confirmEmail
);

// ========user routes========
userRouter.get(
  "/getProfile",
  validation(UV.getProfilePublicSchema),
  authentication,
  authorization([userRoles.user]),
  UC.getProfile
);
userRouter.get(
  "/getProfile/:id",
  validation(UV.getProfileSchema),
  UC.getProfileData
);
userRouter.post(
  "/logout",
  validation(UV.logoutSchema),
  authentication,
  UC.logout
);
userRouter.post(
  "/refreshToken",
  validation(UV.refreshTokenSchema),
  UC.refreshToken
);
userRouter.patch(
  "/updatePassword",
  validation(UV.updatePasswordSchema),
  authentication,
  UC.updatePassword
);

userRouter.post(
  "/forgetPassword",
  validation(UV.forgetPasswordSchema),
  UC.forgetPassword
);
userRouter.post(
  "/resetPassword",
  validation(UV.resetPasswordSchema),
  UC.resetPassword
);
userRouter.patch(
  "/updateProfile",
  validation(UV.updateProfileSchema),
  authentication,
  UC.updateProfile
);

userRouter.delete(
  "/freeze/{:id}",
  validation(UV.freezeAccountSchema),
  authentication,
  UC.freezeAccount
);
userRouter.delete(
  "/unfreeze/{:id}",
  validation(UV.unfreezeAccountSchema),
  authentication,
  UC.unfreezeAccount
);

userRouter.patch(
  "/profile-image",
  authentication,
  localFileUpload({ customPath: "users" }).single("profileImage"),
  UC.uploadProfileImage
);

export default userRouter;
