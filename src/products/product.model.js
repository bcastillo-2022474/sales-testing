import { model, Schema } from "mongoose";

const Product = new Schema({
  name: {
    required: true,
    type: String,
    unique: true,
  },
  description: String,
  category: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  // meta data attributes
  tp_status: {
    type: Boolean,
    default: true,
  },
});

export default model("Product", Product);
