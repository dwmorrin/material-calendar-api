/**
 * tags indicate properties you can indicate for a given category of item
 * the category field helps admins consistently use appropriate tags for
 * the same category of item
 */
const tagSchema = {
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: { type: "ObjectId", ref: "category" },
};

export default tagSchema;
