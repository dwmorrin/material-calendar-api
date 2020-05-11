import mongoose from "mongoose";

const locationHoursSchema = new mongoose.Schema({
  day: {
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    required: true,
  },
  hours: {
    type: Number,
    required: true,
  },
});

/**
 * properties should match FullCalendar's resource object where appropriate
 * https://fullcalendar.io/docs/resource-object
 * example use cases:
 * - locations that have reservable timeslots
 * - staff scheduling
 */
const resourceSchema = new mongoose.Schema(
  {
    title: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    groupId: String,
    eventColor: String,
    hours: [locationHoursSchema],
    rules: {}, // placeholder for business logic
    // maxHours: Number, //! verify func of this prop.  Why not just sum hours?
    // nested resources?
  },
  { timestamps: true }
);

export const Resource = mongoose.model("resource", resourceSchema);
