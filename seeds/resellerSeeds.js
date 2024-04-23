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

const resellerSchema = new mongoose.Schema({
  email: { type: String, required: true },

  password: { type: String, required: true },

  userType: { type: String, default: "reseller" },

  name: { type: String, required: true },

  phone: { type: String, required: true },

  users: { type: Array },
});

let resellerModel = new mongoose.model("Reseller", resellerSchema, "reseller");

async function insertresellers() {
  try {
    let reseller = {
      name: "yash",
      password: bcrypt.hashSync("yash1234", 12),
      email: "yashsabal@gmail.com",
      phone: "7972872410",
      users: [],
    };

    let resellerData = new resellerModel(reseller);

    await resellerData.save();
    console.log(`resellers Added Successfully`);
  } catch (error) {
    console.log(error);
  }
}
insertresellers();
