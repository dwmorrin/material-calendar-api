import mongoose from "mongoose";

/**
 * categories allow for grouping equipment in a hierachy.
 * {@link https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/}
 * alternative strategy:
 * {@link https://docs.mongodb.com/drivers/use-cases/category-hierarchy}
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  path: String, // e.g. ",Root,SubCategory1,SubCategory2,"; null == root
});

export const Category = mongoose.model("category", categorySchema);
