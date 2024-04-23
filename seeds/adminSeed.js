import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://nikesh:nikesh888@project0.v9upziv.mongodb.net/"
    );
    console.log(`Mongo DB Connected`);
  } catch (error) {
    console.error(error);
  }
}

connectDB();

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true },

  password: { type: String, required: true },

  userType: { type: String, default: "admin" },
});

let adminModel = new mongoose.model("Admin", adminSchema, "admin");

async function insertAdmin() {
  try {
    let admin = {
      name: "nikesh",
      password: bcrypt.hashSync("nikesh888", 12),
      email: "nikesh.nckinfotech@gmail.com",
    };

    let adminData = new adminModel(admin);

    await adminData.save();
    console.log(`Admin Added Successfully`);
  } catch (error) {
    console.log(error);
  }
}
insertAdmin();
