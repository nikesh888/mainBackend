import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true },

  password: { type: String, required: true },

  userType: { type: String, default: "admin" },

  ressellers: { type: Array },

  inquiries: { type: Array },

  companyName: { type: String },

  companylogo: { type: String },
});

export default mongoose.model("Admin", adminSchema, "admin");
