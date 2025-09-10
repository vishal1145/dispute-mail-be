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
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    field: {
      type: String,
      enum: [
        "Mediation",
        "Conciliation",
        "Arbitration",
        "Negotiation",
        "Facilitation",
        "Litigation",
      ],
      required: true,
    },
    licensedBy: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      subject: { type: String, default: "" },
      body: { type: String, default: "" },
    },
    email_sent: {
      type: Boolean,
      default: false, // <- default is now false
    },
  },
  { timestamps: true }
);

export default mongoose.model("Member", memberSchema);
