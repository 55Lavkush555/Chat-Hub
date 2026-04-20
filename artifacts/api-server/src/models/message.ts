import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  },
);

// Index for efficient conversation lookups
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1 });

export const Message: Model<IMessage> =
  mongoose.models["Message"] ??
  mongoose.model<IMessage>("Message", MessageSchema);

export function formatMessage(
  msg: IMessage,
  senderUsername?: string,
) {
  return {
    id: msg._id.toString(),
    senderId: msg.senderId.toString(),
    receiverId: msg.receiverId.toString(),
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    senderUsername: senderUsername ?? undefined,
  };
}
