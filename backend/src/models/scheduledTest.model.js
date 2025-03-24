import mongoose, { Schema } from "mongoose";

const scheduledTestSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    examType: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "PreviousTest",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduledTest = mongoose.model("ScheduledTest", scheduledTestSchema); 