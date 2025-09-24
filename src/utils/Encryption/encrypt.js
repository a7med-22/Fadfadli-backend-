import CryptoJS from "crypto-js";

export const encrypt = async ({ plainText, secretKey }) => {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
};
