import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  passwordHash: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

// Expose _id as id in JSON
UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

export const User: Model<IUser> =
  mongoose.models["User"] ?? mongoose.model<IUser>("User", UserSchema);

export function formatUser(user: IUser) {
  return {
    id: user._id.toString(),
    username: user.username,
    avatarUrl: user.avatar ?? undefined,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen?.toISOString() ?? undefined,
  };
}
