import mongoose from "mongoose";

/**
 * tags indicate properties you can indicate for a given category of item
 * the category field helps admins consistently use appropriate tags for
 * the same category of item
 */
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: { type: mongoose.SchemaTypes.ObjectId, ref: "category" },
});

export const Tag = mongoose.model("tag", tagSchema);
