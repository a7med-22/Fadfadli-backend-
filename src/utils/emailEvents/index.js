import { EventEmitter } from "events";
import { sendEmail } from "../../service/sendEmail.js";
import { generateToken } from "../token/generateToken.js";

export const emailEmitter = new EventEmitter();

emailEmitter.on("sendEmail", async (data) => {
  const { email } = data;
  const token = await generateToken({
    payload: { email },
    signature: process.env.CONFIRMATION_EMAIL,
    options: {
      expiresIn: 3 * 60,
    },
  });

  const link = `http://localhost:3000/users/confirmEmail/${token}`;
  const isSend = await sendEmail({
    to: email,
    html: `<a href="${link}">Confirm Email</a>`,
  });

  if (!isSend) {
    throw new Error("Failed to send confirmation email.", { cause: 400 });
  }
});



emailEmitter.on("forgetPassword", async (data) => {
  const { email, otp } = data;

  const isSend = await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    html: `<h1>Your OTP for password reset is: <strong>${otp}</strong></h1>`,
  });

  if (!isSend) {
    throw new Error("Failed to send password reset email.", { cause: 400 });
  }
});
