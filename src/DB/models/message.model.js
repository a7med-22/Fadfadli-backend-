import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 200000,
      required: function () {
        return this.attachments.length === 0;
      },
    },

    attachments: [
      {
        secure_url: String,
        public_id: String,
      },
    ],

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const messageModel =
  mongoose.models.message || mongoose.model("message", messageSchema);

export default messageModel;
