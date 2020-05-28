/**
 * the who, what, and when for an action taken
 */
const actionDetailsSchema = {
  user: { type: "ObjectId", ref: "user" },
  reason: String,
};

const notesSchema = {
  user: { type: "ObjectId", ref: "user" },
  text: String,
};

/**
 * reservations allow users to claim events
 * these function as "shopping carts"
 */
const reservationSchema = {
  status: {
    type: String,
    enum: [
      // normal cycle: active -> pending -> complete
      "active", // user is shopping, can expire
      "pending", // user has POSTed details to server, server is checking
      "complete", // system has approved the reservation; the time is reserved

      // cancellation cycle: complete -> cancelling -> cancelled
      "cancelling", // user has initiated a cancellation request
      "cancelled", // soft-delete

      // expiration cycle: active -> expiring -> expired
      "expiring", // user abandoned their shopping cart, system will clean
      "expired", // soft-delete; could show to user on next visit and then hard delete
    ],
  },
  expires: Date, // TODO write methods to cleanup expired reservations

  // main properties
  description: String, // what the owners will be doing, for admins to review
  event: { type: "ObjectId", ref: "event" },
  project: { type: "ObjectId", ref: "project" },
  owners: [{ type: "ObjectId", ref: "user" }],

  // extended properties
  guests: [String], // 3rd party guests the users want to alert admins about
  equipment: [{ type: "ObjectId", ref: "equipment" }],
  notes: [notesSchema],

  cancellation: {
    // TODO write methods to unlink events when cancellation is approved
    requested: actionDetailsSchema, // by a reservation owner
    approved: actionDetailsSchema, // by admin
    rejected: actionDetailsSchema, // by admin
  },
};

export default reservationSchema;
