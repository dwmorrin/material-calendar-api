/**
 * Equipment represents a physical item that can be reserved for an event
 * Categories follow a strict hierarchy path.  Use sparingly.
 * Tags are for searching, filtering, and grouping.  Use freely.
 */
const equipmentSchema = {
  category: { type: "ObjectId", ref: "category" },
  tags: [{ type: "ObjectId", ref: "tag" }],
  manufacturer: String,
  model: String,
  description: {
    type: String,
    required: true,
  },
  sku: String, // stock keeping unit, typically assigned by a retailer
  serial: String, // typically assigned by the manufacturer
  barcode: String, //! barcodes in a magic range are fungible
  notes: String, // private notes for admin users, not displayed publicly
  quantity: {
    //! serialized and/or barcoded physical items should always have qty = 1
    // serialized items with identical make & model should have an aggregated qty
    type: Number,
    default: 1,
  },
  reservations: [{ type: "ObjectId", ref: "event" }],
  consumable: {
    // does this item wear out? (useful to report to admins for reordering)
    type: Boolean,
    default: false,
  },
  // checkedOut: {
  //   //! this only makes sense for non-fungible items
  //   //! moreover, is the "reservations" field already handling this?
  //   type: Boolean,
  //   default: false,
  // },
};

export default equipmentSchema;
