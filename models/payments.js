import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  email: { type: String, required: true },

  name: { type: String, required: true },

  phone: { type: String, required: true },

  owner: { type: String },

  amount: { type: Number, default: 0 },

  method: { type: String, required: true },

  date: { type: Date },
});

export default mongoose.model("Payment", paymentSchema, "payment");
