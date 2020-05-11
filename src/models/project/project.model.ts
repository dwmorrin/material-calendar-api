import mongoose from "mongoose";

const projectAllotmentSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
  },
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String, // defaults to group description
  start: Date,
  end: Date,
  // reservationStart: Date, //! do we need to differentiate from start?
  // reservationEnd: Date, //! do we need to differentiate from end?
  locations: [{ type: mongoose.SchemaTypes.ObjectId, ref: "location" }],
  // groupSize: Number, //! think through this one
  // open: Boolean, //! seems to always be "open"
  group: {
    //! replaces "course"
    title: String,
    description: String,
    details: {}, // e.g. grouped by an edu course may have course #, section #
  },
  managers: [{ type: mongoose.SchemaTypes.ObjectId, ref: "user" }],
  members: [{ type: mongoose.SchemaTypes.ObjectId, ref: "user" }],
  allotments: [projectAllotmentSchema],
});

export const Project = mongoose.model("project", projectSchema);
