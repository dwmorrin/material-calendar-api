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

const relation = {
  project: {
    type: "ObjectId",
    ref: "project",
  },
  requested: {
    type: "ObjectId",
    ref: "user",
  },
  accepted: {
    type: "ObjectId",
    ref: "user",
  },
};

const userSchema = {
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
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
  projects: [{ type: "ObjectId", ref: "project" }],
  relations: [relation],
  lastLogin: Date,
};

export default userSchema;
