/**
 * properties should match with FullCalendar's event objects where appropriate
 * https://fullcalendar.io/docs/event-object
 */
const eventSchema = {
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  location: {
    type: "ObjectId",
    ref: "location",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  groupId: String,
  reservable: Boolean,
};

export default eventSchema;
