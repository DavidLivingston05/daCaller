import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "Answered", "Missed"],
    default: "Pending",
  },
  group: { type: String, default: "" },
  notes: { type: String, default: "" },
  lastCalledAt: { type: Number, default: null },
  callCount: { type: Number, default: 0 },
}, { timestamps: true });

ContactSchema.index({ phone: 1 });
ContactSchema.index({ name: "text", phone: "text" });

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
