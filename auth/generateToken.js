import jwt from "jsonwebtoken";
import cryptoJS from "crypto-js";
import dotenv from "dotenv";
dotenv.config();
const JWT = process.env.JWT;
const CRYPTO = process.env.CRYPTO;

function generateToken(payload) {
  try {
    const token = jwt.sign(payload, JWT);
    let cipherToken = cryptoJS.AES.encrypt(token, CRYPTO).toString();
    return cipherToken;
  } catch (err) {
    return;
  }
}

export default generateToken;
