import mongoose from "mongoose";

const resellerSchema = new mongoose.Schema({
  email: { type: String, required: true },

  password: { type: String, required: true },

  userType: { type: String, default: "reseller" },

  name: { type: String, required: true },

  inquiries: { type: Array },

  companyName: { type: String },

  companylogo: { type: String },
});

export default mongoose.model("Reseller", resellerSchema, "reseller");
