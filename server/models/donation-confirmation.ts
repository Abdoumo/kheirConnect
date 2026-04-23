import mongoose from "mongoose";

const donationConfirmationSchema = new mongoose.Schema(
  {
    donatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    weeklyNeedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyNeed",
      required: true,
    },
    needTitle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "declined"],
      required: true,
    },
    donationDetails: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const DonationConfirmation = mongoose.model(
  "DonationConfirmation",
  donationConfirmationSchema
);
