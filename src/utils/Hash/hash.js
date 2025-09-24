import bcrypt from "bcrypt";

export const hash = async ({
  plainText,
  saltRounds = process.env.SALT_ROUNDS,
}) => {
  return bcrypt.hashSync(plainText, parseInt(saltRounds));
};
