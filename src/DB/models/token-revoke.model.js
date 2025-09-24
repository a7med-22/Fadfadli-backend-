import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    expireAt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const revokeTokenModel =
  mongoose.models.revokeToken ||
  mongoose.model("revokeToken", revokeTokenSchema);

export default revokeTokenModel;
