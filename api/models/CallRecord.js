import mongoose from "mongoose";

const CallRecordSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  outcome: { type: String, enum: ["Answered", "Missed", "Wrong Number"], required: true },
  timestamp: { type: Number, required: true },
  duration: { type: Number, default: 0 },
}, { timestamps: true });

CallRecordSchema.index({ timestamp: -1 });
CallRecordSchema.index({ contactId: 1 });

export default mongoose.models.CallRecord || mongoose.model("CallRecord", CallRecordSchema);
