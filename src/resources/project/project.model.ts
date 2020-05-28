const projectAllotmentSchema = {
  location: {
    type: "ObjectId",
    ref: "location",
  },
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
};

const projectSchema = {
  title: String,
  description: String, // defaults to group description
  start: Date,
  end: Date,
  // reservationStart: Date, //TODO implement this - not allowed to book prior to
  // reservationEnd: Date, //! should always == end
  locations: [{ type: "ObjectId", ref: "location" }],
  // groupSize: Number, //! think through this one
  // open: Boolean, //! seems to always be "open"
  group: {
    //! replaces "course"
    title: String,
    description: String,
    details: {}, // e.g. grouped by an edu course may have course #, section #
  },
  managers: [{ type: "ObjectId", ref: "user" }],
  members: [{ type: "ObjectId", ref: "user" }],
  allotments: [projectAllotmentSchema],
};

export default projectSchema;
