/**
 * categories allow for grouping equipment in a hierachy.
 */
const categorySchema = {
  name: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  path: String, // e.g. ",Root,SubCategory1,SubCategory2,"; null == root
};

export default categorySchema;
