import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    state: {
      type: String,
      trim: true,
    },
    number: {
      type: String,
    },
    field: {
      type: String,
      // enum: [
      //   "Mediation",
      //   "Conciliation",
      //   "Arbitration",
      //   "Negotiation",
      //   "Facilitation",
      //   "Litigation",
      //   "N/A"
      // ],
    },
    licensedBy: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    message: {
      subject: { type: String, default: "" },
      body: { type: String, default: "" },
    },
    email_sent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
