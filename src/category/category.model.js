import { model, Schema } from "mongoose";

const Category = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // meta data attributes
  tp_status: {
    type: Boolean,
    default: true,
  },
});

export default model("Category", Category);
