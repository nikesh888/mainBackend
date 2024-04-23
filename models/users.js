import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },

  password: { type: String, required: true },

  name: { type: String, required: true },

  phone: { type: String, required: true },

  owner: { type: String },

  database: { type: Boolean },

  whatsapp: { type: Boolean },
});

export default mongoose.model("User", userSchema, "users");
