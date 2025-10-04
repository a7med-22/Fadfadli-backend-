import mongoose from "mongoose";

export const userGender = {
  male: "male",
  female: "female",
};

export const userRoles = {
  user: "user",
  admin: "admin",
};

export const providers = {
  system: "system",
  google: "google",
};

function isFieldRequired() {
  return this.provider === providers.system;
}
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(userGender),
    },

    password: {
      type: String,
      required: isFieldRequired,
      minLength: 6,
    },
    oldPasswords: [
      {
        type: String,
      },
    ],
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    phone: {
      type: String,
      trim: true,
      required: isFieldRequired,
    },
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.user,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    profileImage: String,
    coverImages: [String],
    provider: {
      type: String,
      enum: Object.values(providers),
      default: providers.system,
    },
    otp: String,
    isDeleted: Boolean,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    restoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
