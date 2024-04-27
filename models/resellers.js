import mongoose from "mongoose";

const resellerSchema = new mongoose.Schema({
  email: { type: String, required: true },

  password: { type: String, required: true },

  userType: { type: String, default: "reseller" },

  name: { type: String, required: true },

  companyName: { type: String, default: "New Reseller" },

  companylogo: { type: String, default: "New Reseller logo" },
});

export default mongoose.model("Reseller", resellerSchema, "reseller");
