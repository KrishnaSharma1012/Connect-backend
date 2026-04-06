import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
  {
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceModel",
      required: true,
    },
    sourceModel: {
      type: String,
      enum: ["Course", "Session"],
      required: true,
    },
    sourceTitle: { type: String, default: "" },       // denormalised for display
    grossAmount: { type: Number, required: true },    // full price paid by student
    alumniShare: { type: Number, required: true },    // 80% of grossAmount
    platformFee: { type: Number, required: true },    // 20% of grossAmount
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "paid", "withdrawn"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["session", "workshop", "course", "mentorship"],
      default: "session",
    },
  },
  { timestamps: true }
);

const Earning = mongoose.model("Earning", earningSchema);
export default Earning;