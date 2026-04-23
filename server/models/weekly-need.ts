import mongoose from "mongoose";

const weeklyNeedSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["urgent", "quotidien"],
      default: "quotidien",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WeeklyNeed = mongoose.model("WeeklyNeed", weeklyNeedSchema);
