import mongoose from "mongoose";

/**
 * defaultUser is intended to be created when there are 0 users in the databases
 * so the system can bootstrap itself.
 * The system admin should use this account initially and either update the
 * details or create a new user for themselves and delete this one.
 * Look for a database init function for usage.
 */
export const defaultUser = {
  username: "admin",
  roles: ["admin"],
};

const relation = new mongoose.Schema(
  {
    project: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "project",
    },
    requested: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
    accepted: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      first: { type: String, trim: true },
      middle: { type: String, trim: true },
      last: { type: String, trim: true },
    },
    contact: {
      email: [String],
      phone: [String],
    },
    settings: {}, // personal app settings, ad hoc for now
    roles: {
      required: true,
      type: [String], // e.g. "user", "admin"; let app admins define
    },
    projects: [{ type: mongoose.SchemaTypes.ObjectId, ref: "project" }],
    relations: [relation],
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.index({ username: 1 });
export const User = mongoose.model("user", userSchema);
