import { customAlphabet } from "nanoid";
import revokeTokenModel from "../../DB/models/token-revoke.model.js";
import userModel, { providers, userRoles } from "../../DB/models/user.model.js";
import { emailEmitter } from "../../utils/emailEvents/index.js";
import { decrypt, encrypt } from "../../utils/Encryption/index.js";
import { compare, hash } from "../../utils/Hash/index.js";
import {
  destroyFile,
  destroyFiles,
  uploadFile,
  uploadFiles,
} from "../../utils/multer/cloudinary.js";
import { successResponse } from "../../utils/response.js";
import { generateTokens } from "../../utils/token/generateTokens.js";
import { verifyToken } from "../../utils/token/index.js";
import { verifyGoogleAccount } from "../../utils/token/verifyTokenWithGoogle.js";

export const signup = async (req, res, next) => {
  const { name, email, age, gender, password, cPassword, phone, role } =
    req.body;

  if (await userModel.findOne({ email })) {
    // return next(new Error("Email already exists"));
    throw new Error("Email already exists", { cause: 400 });
  }

  const hashedPassword = await hash({
    plainText: password,
    saltRounds: process.env.SALT_ROUNDS,
  });
  // const hashedPassword = bcrypt.hashSync(
  //   password,
  //   parseInt(process.env.SALT_ROUNDS)
  // );

  // Encrypt
  var encryptedPhone = await encrypt({
    plainText: phone,
    secretKey: process.env.SECRET_KEY_PHONE,
  });

  emailEmitter.emit("sendEmail", { email }); // to be done behind the scene and delay the response for frontend , ( it will respond to frontend first while sending the email is running , it could be done after the response to frontend)

  const user = await userModel.create({
    name,
    email,
    age,
    gender,
    password: hashedPassword,
    phone: encryptedPhone,
    role,
  });

  return successResponse({
    res,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role,
      },
    },
    message:
      "User created successfully. Please check your email to confirm your account.",
    status: 201,
  });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
    confirmed: true,
    provider: providers.system,
  });
  if (!user) {
    throw new Error("user not exist or not confirmed ", { cause: 404 });
  }

  const isMatch = await compare({
    plainText: password,
    cipherText: user.password,
  });
  if (!isMatch) {
    throw new Error("Invalid credentials", { cause: 401 });
  }

  // Decrypt phone for response
  let decryptedPhone = null;
  if (user.phone) {
    decryptedPhone = await decrypt({
      cipherText: user.phone,
      secretKey: process.env.SECRET_KEY_PHONE,
    });
  }

  const { access_token, refresh_token } = await generateTokens(user);

  return successResponse({
    res,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        phone: decryptedPhone,
      },
      credentials: { access_token, refresh_token },
    },
    message: "Sign in successful",
  });
};

export const signupWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const { name, email, picture, email_verified } = await verifyGoogleAccount({
    idToken,
  });
  if (!email_verified) {
    throw new Error("Not Verified Account", { cause: 400 });
  }

  if (await userModel.findOne({ email })) {
    // return next(new Error("Email already exists"));

    throw new Error("Email already exists", { cause: 409 });
  }

  const newUser = await userModel.create({
    name,
    email,
    image: picture,
    confirmed: email_verified,
    role: userRoles.user,
    provider: providers.google,
  });

  return successResponse({
    res,
    data: {
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
        role: newUser.role,
        age: newUser.age,
        gender: newUser.gender,
      },
    },
    message: "User created successfully",
    status: 201,
  });
};

export const signInWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const { email, email_verified } = await verifyGoogleAccount({
    idToken,
  });
  if (!email_verified) {
    throw new Error("Not Verified Account", { cause: 400 });
  }

  const user = await userModel.findOne({ email, provider: providers.google });

  if (!user) {
    throw new Error("Invalid credentials or invalid provider", { cause: 400 });
  }

  // Decrypt phone if exists for Google users
  let decryptedPhone = null;
  if (user.phone) {
    decryptedPhone = await decrypt({
      cipherText: user.phone,
      secretKey: process.env.SECRET_KEY_PHONE,
    });
  }

  const { access_token, refresh_token } = await generateTokens(user);

  return successResponse({
    res,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        phone: decryptedPhone,
        image: user.image,
      },
      credentials: { access_token, refresh_token },
    },
    message: "Sign in successful",
  });
};

export const signupAndSigninWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const { name, email, picture, email_verified } = await verifyGoogleAccount({
    idToken,
  });
  if (!email_verified) {
    throw new Error("Not Verified Account", { cause: 400 });
  }

  let user = await userModel.findOne({ email });

  let statusCode = 200;
  if (!user) {
    user = await userModel.create({
      name,
      email,
      image: picture,
      confirmed: email_verified,
      role: userRoles.user,
      provider: providers.google,
    });
    statusCode = 201;
  }

  if (user.provider !== providers.google) {
    throw new Error("Unable to sign up. Please try again.", { cause: 409 });
  }

  const { access_token, refresh_token } = await generateTokens(user);

  return successResponse({
    res,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        age: user.age,
        gender: user.gender,
      },
      credentials: { access_token, refresh_token },
    },
    message:
      statusCode === 201
        ? "User created and signed in successfully"
        : "Signed in successful",
    status: statusCode,
  });
};

export const getProfile = async (req, res, next) => {
  const user = await userModel.findById(req.user._id).populate("messages");
  var decryptedPhone = await decrypt({
    cipherText: user.phone,
    secretKey: process.env.SECRET_KEY_PHONE,
  });
  if (!decryptedPhone) {
    throw new Error("Failed to decrypt phone number", { cause: 500 });
  }

  user.phone = decryptedPhone;
  return successResponse({
    res,
    data: {
      user: user,
    },
    message: "Profile retrieved successfully",
  });
};

export const confirmEmail = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    throw new Error("token not exist", { cause: 400 });
  }

  const decodedEmail = await verifyToken({
    token,
    signature: process.env.CONFIRMATION_EMAIL,
  });

  if (!decodedEmail) {
    throw new Error("Invalid or expired token", { cause: 401 });
  }

  const user = await userModel.findOne({
    email: decodedEmail.email,
  });

  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  if (user.confirmed) {
    throw new Error("Email already confirmed", { cause: 400 });
  }

  user.confirmed = true;
  await user.save();

  return successResponse({
    res,
    data: {},
    message: "Email confirmed successfully",
  });
};

export const logout = async (req, res, next) => {
  const revokeToken = await revokeTokenModel.create({
    tokenId: req.decodedUser.jti,
    expireAt: req.decodedUser.exp,
  });

  return successResponse({
    res,
    data: {
      revokeToken,
    },
    message: "Logged out successfully",
  });
};

export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;

  const [prefix, token] = authorization?.split(" ") || [];

  let signature = "";

  if (!prefix || !token) {
    throw new Error("token not exist", { cause: 401 });
  }

  if (prefix.toLowerCase() === process.env.BEARER_USER) {
    signature = process.env.REFRESH_TOKEN_USER;
  } else if (prefix.toLowerCase() === process.env.BEARER_ADMIN) {
    signature = process.env.REFRESH_TOKEN_ADMIN;
  } else {
    throw new Error("Invalid token prefix", { cause: 401 });
  }

  const decodedUser = await verifyToken({ token, signature });

  if (!decodedUser) {
    throw new Error("Invalid or expired token", { cause: 401 });
  }

  const isRevoked = await revokeTokenModel.findOne({
    tokenId: decodedUser.jti,
  });
  if (isRevoked) {
    throw new Error("Logged out. Please log in again.", { cause: 401 });
  }

  const user = await userModel
    .findById(decodedUser.id, {
      password: 0,
      __v: 0,
    })
    .lean();
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  const { access_token, refresh_token } = await generateTokens(user);

  return successResponse({
    res,
    data: {
      access_token,
      refresh_token,
    },
    message: "Token refreshed successfully",
  });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, password } = req.body;

  // Check if old password is correct
  if (
    !(await compare({ plainText: oldPassword, cipherText: req.user.password }))
  ) {
    throw new Error("invalid oldPassword", { cause: 400 });
  }

  // Check if new password is same as current password
  if (await compare({ plainText: password, cipherText: req.user.password })) {
    throw new Error(
      "Password has been used recently. Please choose a different password",
      {
        cause: 400,
      }
    );
  }

  // Check if new password matches any old password
  const oldPasswords = req.user.oldPasswords || [];
  for (const oldPassword of oldPasswords) {
    if (await compare({ plainText: password, cipherText: oldPassword })) {
      throw new Error(
        "Password has been used recently. Please choose a different password",
        {
          cause: 400,
        }
      );
    }
  }

  // Hash the new password
  const hashedNewPassword = await hash({
    plainText: password,
  });

  // Add current password to oldPasswords array
  req.user.oldPasswords = req.user.oldPasswords || [];
  req.user.oldPasswords.push(req.user.password);

  // Keep only last 5 old passwords to prevent unlimited growth
  if (req.user.oldPasswords.length > 5) {
    req.user.oldPasswords = req.user.oldPasswords.slice(-5);
  }

  // Update to new password
  req.user.password = hashedNewPassword;
  await req.user.save();

  // Revoke current token to force re-login
  await revokeTokenModel.create({
    tokenId: req.decodedUser.jti,
    expireAt: req.decodedUser.exp,
  });

  return successResponse({
    res,
    data: {},
    message: "Password updated successfully",
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }
  const otp = customAlphabet("1234567890", 6)();

  emailEmitter.emit("forgetPassword", { email, otp });

  const hashOtp = await hash({ plainText: otp });

  user.otp = hashOtp;
  await user.save();

  return successResponse({
    res,
    data: {},
    message: "OTP sent to email",
  });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;

  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("user not exist or OTP expired", { cause: 404 });
  }

  if (!(await compare({ plainText: otp, cipherText: user.otp }))) {
    throw new Error("Invalid OTP", { cause: 400 });
  }

  // Check if new password is same as current password
  if (
    user.password &&
    (await compare({ plainText: password, cipherText: user.password }))
  ) {
    throw new Error(
      "Password has been used recently. Please choose a different password",
      {
        cause: 400,
      }
    );
  }

  // Check if new password matches any old password
  const oldPasswords = user.oldPasswords || [];
  for (const oldPassword of oldPasswords) {
    if (await compare({ plainText: password, cipherText: oldPassword })) {
      throw new Error(
        "Password has been used recently. Please choose a different password",
        {
          cause: 400,
        }
      );
    }
  }

  const hashedNewPassword = await hash({
    plainText: password,
  });

  // Prepare update object
  const updateObject = {
    $set: { password: hashedNewPassword },
    $unset: { otp: "" }, // Completely removes the otp field
    $inc: { __v: 1 },
  };

  // Add current password to oldPasswords if it exists
  if (user.password) {
    updateObject.$push = {
      oldPasswords: {
        $each: [user.password],
        $slice: -5, // Keep only last 5 old passwords
      },
    };
  }

  await userModel.updateOne({ _id: user._id }, updateObject);

  return successResponse({
    res,
    data: {},
    message: "Password reset successfully",
  });
};

export const updateProfile = async (req, res, next) => {
  const { name, email, age, gender, phone } = req.body;

  if (name) req.user.name = name;
  if (age) req.user.age = age;
  if (gender) req.user.gender = gender;
  if (phone) {
    var encryptedPhone = await encrypt({
      plainText: phone,
      secretKey: process.env.SECRET_KEY_PHONE,
    });

    req.user.phone = encryptedPhone;
  }

  if (email) {
    if (await userModel.findOne({ email })) {
      // return next(new Error("Email already exists"));
      throw new Error("Email already exists", { cause: 400 });
    }

    emailEmitter.emit("sendEmail", { email });

    req.user.email = email;
    req.user.confirmed = false;
  }

  await req.user.save();

  return successResponse({
    res,
    data: {
      user: req.user,
    },
    message: "Profile updated successfully",
  });
};

export const getProfileData = async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel
    .findById(id)
    .select("-password -__v -role -phone -confirmed -createdAt -updatedAt");
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }
  return successResponse({
    res,
    data: {
      user,
    },
    message: "Profile retrieved successfully",
  });
};

export const freezeAccount = async (req, res, next) => {
  const { id } = req.params;

  if (id && req.user.role !== userRoles.admin) {
    throw new Error("You can't freeze this account", { cause: 403 });
  }

  const userFreezed = await userModel.updateOne(
    {
      _id: id || req.user._id,
      deletedAt: { $exists: false },
    },
    {
      $set: { deletedAt: new Date(), deletedBy: req.user._id },
      $inc: { __v: 1 },
      $unset: { restoredAt: "", restoredBy: "" },
    }
  );

  if (!userFreezed.modifiedCount) {
    throw new Error("Account already freezed or not exist", { cause: 400 });
  }

  return successResponse({
    res,
    data: {},
    message: "Account freezed successfully",
  });
};

export const unfreezeAccount = async (req, res, next) => {
  const { id } = req.params;

  if (id && req.user.role !== userRoles.admin) {
    throw new Error("You can't unfreeze this account", { cause: 403 });
  }

  // Only the actor who froze the account (stored in deletedBy) can unfreeze it.
  // If an admin froze another user's account, only that same admin can unfreeze it.
  const userUnfreezed = await userModel.updateOne(
    {
      _id: id || req.user._id,
      deletedAt: { $exists: true },
      deletedBy: req.user._id, // Ensure only the user freezed the account is the only one can unfreezed the account
    },
    {
      $unset: { deletedAt: "", deletedBy: "" },
      $inc: { __v: 1 },
      $set: {
        restoredAt: new Date(),
        restoredBy: req.user._id,
      },
    }
  );

  if (!userUnfreezed.modifiedCount) {
    throw new Error("Account already unfreezed or not exist", { cause: 400 });
  }

  return successResponse({
    res,
    data: {},
    message: "Account unfreezed successfully",
  });
};
export const deleteAccount = async (req, res, next) => {
  const { id } = req.params;

  const userDeleted = await userModel.deleteOne({
    _id: id || req.user._id,
    deletedAt: { $exists: true },
  });

  if (!userDeleted.deletedCount) {
    throw new Error("Account already deleted or not exist", { cause: 400 });
  }

  return successResponse({
    res,
    message: "Account deleted successfully",
  });
};

// for local storage
// export const uploadProfileImageLocal = async (req, res, next) => {
//   const user = await userModel.findOneAndUpdate(
//     {
//       _id: req.user._id,
//     },
//     {
//       profileImage: req.file.filePath,
//     },
//     {
//       new: true,
//       select: "-password  -__v", // Exclude sensitive fields
//     }
//   );
//   return successResponse({
//     res,
//     data: user,
//     message: "Profile image uploaded successfully",
//   });
// };

// for local storage
// export const uploadCoverImagesLocal = async (req, res, next) => {
//   const user = await userModel.findOneAndUpdate(
//     {
//       _id: req.user._id,
//     },
//     {
//       $push: { coverImages: req.files.map((file) => file.filePath) },
//     },
//     {
//       new: true,
//       select: "-password  -__v", // Exclude sensitive fields
//     }
//   );
//   return successResponse({
//     res,
//     data: user,
//     message: "Cover images uploaded successfully",
//   });
// };

// for cloud storage
export const uploadProfileImageCloud = async (req, res, next) => {
  const { secure_url, public_id } = await uploadFile({
    file: req.file,
    filePath: `users/${req.user._id}`,
  });

  if (!secure_url || !public_id) {
    throw new Error("Failed to upload image to cloud", { cause: 500 });
  }

  const user = await userModel.findOneAndUpdate(
    {
      _id: req.user._id,
    },
    {
      profileImage: { secure_url, public_id },
    },
    {
      new: false, // to get the old data before update and delete the old image from cloud
      select: "-password  -__v", // Exclude sensitive fields
    }
  );

  // Delete previous image from cloud if exists
  if (user.profileImage?.public_id) {
    await destroyFile({ publicId: user.profileImage.public_id });
  }

  return successResponse({
    res,
    data: req.file,
    message: "Profile image uploaded successfully",
  });
};

// for cloud storage
export const uploadCoverImagesCloud = async (req, res, next) => {
  const attachments = await uploadFiles({
    files: req.files,
    filePath: `users/${req.user._id}/cover`,
  });

  if (attachments.length === 0) {
    throw new Error("Failed to upload images to cloud", { cause: 500 });
  }

  const user = await userModel.findOneAndUpdate(
    {
      _id: req.user._id,
    },
    {
      coverImages: attachments,
    },
    {
      new: false,
      select: "-password  -__v", // Exclude sensitive fields
    }
  );

  if (user.coverImages?.length) {
    await destroyFiles({
      publicIds: user.coverImages.map((img) => img.public_id),
      options: {
        type: "upload",
        resource_type: "image",
      },
    });
  }

  return successResponse({
    res,
    data: user,
    message: "Cover images uploaded successfully",
  });
};
