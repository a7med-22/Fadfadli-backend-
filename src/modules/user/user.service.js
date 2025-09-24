import { customAlphabet } from "nanoid";
import revokeTokenModel from "../../DB/models/token-revoke.model.js";
import userModel, { providers, userRoles } from "../../DB/models/user.model.js";
import { emailEmitter } from "../../utils/emailEvents/index.js";
import { decrypt, encrypt } from "../../utils/Encryption/index.js";
import { compare, hash } from "../../utils/Hash/index.js";
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

  return res.status(201).json({
    message:
      "User created successfully. Please check your email to confirm your account.",
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

  const { access_token, refresh_token } = await generateTokens(user);

  return res.status(200).json({
    message: "Sign in successful",
    credentials: { access_token, refresh_token },
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

  return res.status(201).json({
    message: "User created successfully",
    user: newUser,
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

  const { access_token, refresh_token } = await generateTokens(user);

  return res.status(200).json({
    message: "Sign in successful",
    credentials: { access_token, refresh_token },
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

  return res.status(statusCode).json({
    message: "Signed in successful",
    credentials: { access_token, refresh_token },
  });
};

export const getProfile = async (req, res, next) => {
  var decryptedPhone = await decrypt({
    cipherText: req.user.phone,
    secretKey: process.env.SECRET_KEY_PHONE,
  });
  if (!decryptedPhone) {
    throw new Error("Failed to decrypt phone number", { cause: 500 });
  }

  req.user.phone = decryptedPhone;
  return res.status(200).json({
    message: "Profile retrieved successfully",
    user: req.user,
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
  console.log(decodedEmail);

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

  return res.status(200).json({
    message: "Email confirmed successfully",
  });
};

export const logout = async (req, res, next) => {
  const revokeToken = await revokeTokenModel.create({
    tokenId: req.decodedUser.jti,
    expireAt: req.decodedUser.exp,
  });

  return res
    .status(200)
    .json({ message: "Logged out successfully", revokeToken });
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

  return res
    .status(200)
    .json({ message: "Success", access_token, refresh_token });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, password } = req.body;

  if (
    !(await compare({ plainText: oldPassword, cipherText: req.user.password }))
  ) {
    throw new Error("invalid oldPassword", { cause: 400 });
  }
  const hashedNewPassword = await hash({
    plainText: password,
  });

  req.user.password = hashedNewPassword;
  await req.user.save();

  await revokeTokenModel.create({
    tokenId: req.decodedUser.jti,
    expireAt: req.decodedUser.exp,
  });

  return res.status(200).json({ message: "Password updated successfully" });
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

  return res.status(200).json({ message: "OTP sent to email" });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;

  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  if (!(await compare({ plainText: otp, cipherText: user.otp }))) {
    throw new Error("Invalid OTP", { cause: 400 });
  }

  const hashedNewPassword = await hash({
    plainText: password,
  });

  user.password = hashedNewPassword;
  user.otp = "";
  await user.save();

  return res.status(200).json({ message: "Password reset successfully" });
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

  return res.status(200).json({
    message: "Profile updated successfully",
    user: req.user,
  });
};

export const getProfileData = async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel
    .findById(id)
    .select(
      "-password -otp -__v -role -phone -confirmed -createdAt -updatedAt"
    );
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }
  return res.status(200).json({
    message: "Profile retrieved successfully",
    user,
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
      isDeleted: { $exists: false },
    },
    { $set: { isDeleted: true, deletedBy: req.user._id }, $inc: { __v: 1 } }
  );

  if (!userFreezed.modifiedCount) {
    throw new Error("Account already freezed or not exist", { cause: 400 });
  }

  res.json({ message: "Account freezed successfully" });
};

export const unfreezeAccount = async (req, res, next) => {
  const { id } = req.params;

  if (id && req.user.role !== userRoles.admin) {
    throw new Error("You can't unfreeze this account", { cause: 403 });
  }

  const userUnfreezed = await userModel.updateOne(
    {
      _id: id || req.user._id,
      isDeleted: { $exists: true },
    },
    {
      $unset: { isDeleted: "", deletedBy: "" },
      $inc: { __v: 1 },
      $set: { restoredBy: req.user._id },
    }
  );

  if (!userUnfreezed.modifiedCount) {
    throw new Error("Account already unfreezed or not exist", { cause: 400 });
  }

  res.json({ message: "Account unfreezed successfully" });
};
