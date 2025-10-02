import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  // Create a test account or replace with real credentials.
  const transporter = nodemailer.createTransport({
    host: "localhost",
    service: "gmail",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "ao6155518@gmail.com",
      pass: "bgznijumqfmwvsjm",
    },
  });

  // Wrap in an async IIFE so we can use await.

  const info = await transporter.sendMail({
    from: '"Ahmed Osama" <ao6155518@gmail.com>',
    to: to || "ahmedosamamarey@gmail.com",
    subject: subject || "Hello",

    html: html || "<b>Hello world?</b>", // HTML body
    attachments: attachments || [],
  });

  if (info.accepted.length > 0) {
    return true;
  } else {
    return false;
  }
};
