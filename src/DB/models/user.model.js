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

export const activeUser = {
  confirmed: true,
  deletedAt: { $exists: false },
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
    // for local
    // profileImage: String,

    // for local
    // coverImages: [String],

    // for cloud

    coverImages: [
      {
        secure_url: String,
        public_id: String,
      },
    ],

    // for cloud
    profileImage: {
      secure_url: String,
      public_id: String,
    },
    provider: {
      type: String,
      enum: Object.values(providers),
      default: providers.system,
    },
    otp: String,
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    restoredAt: Date,
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
