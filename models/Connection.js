import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;