import mongoose from "mongoose";

const donationTurnSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    donatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed"],
      default: "pending",
    },
    weeklyNeeds: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const DonationTurn = mongoose.model("DonationTurn", donationTurnSchema);
