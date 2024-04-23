import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MDB_CONNECT);
    console.log(`Mongo DB Connected`);
  } catch (error) {
    console.error(error);
  }
}

connectDB();
