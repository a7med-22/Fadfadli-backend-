import CryptoJS from "crypto-js";

export const decrypt = async ({ cipherText, secretKey }) => {
  return CryptoJS.AES.decrypt(cipherText, secretKey).toString(
    CryptoJS.enc.Utf8
  );
};
