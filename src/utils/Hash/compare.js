import bcrypt from "bcrypt";

export const compare = async ({ plainText, cipherText }) => {
  return bcrypt.compareSync(plainText, cipherText);
};
