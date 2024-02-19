import { Schema, model } from "mongoose";

const User = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN_ROLE", "CLIENT_ROLE"],
    default: "ADMIN_ROLE",
  },
  // meta data attributes
  tp_status: {
    type: Boolean,
    default: true,
  },
});

export default model("User", User);
