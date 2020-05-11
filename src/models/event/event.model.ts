import mongoose from "mongoose";

/**
 * properties should match with FullCalendar's event objects where appropriate
 * https://fullcalendar.io/docs/event-object
 */
const eventSchema = new mongoose.Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    location: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "resource",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    groupId: String,
  },
  { timestamps: true }
);

export const Event = mongoose.model("event", eventSchema);
