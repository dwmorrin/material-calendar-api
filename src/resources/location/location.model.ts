// following https://fullcalendar.io/docs/businessHours
// times are given in '00:00' format; no upper limit, >=24:00 goes thru midnight
const hoursRegex = /\d+:[0-5]\d/;
// for fullcalendar, this will add visual highlighting
const businessHoursSchema = {
  daysOfWeek: [
    {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday
    },
  ],
  startTime: {
    type: String,
    required: true,
    validate: [(s: string) => hoursRegex.test(s), "format: '00:00'"],
  },
  endTime: {
    type: String,
    required: true,
    validate: [(s: string) => hoursRegex.test(s), "format: '00:00'"],
  },
};

/**
 * properties should match FullCalendar's resource object where appropriate
 * https://fullcalendar.io/docs/resource-object
 * example use cases:
 * - locations that have reservable timeslots
 * - staff scheduling
 */
const locationSchema = {
  title: {
    index: true,
    required: true,
    trim: true,
    type: String,
    unique: true,
  },
  groupId: String,
  eventColor: String,
  businessHours: [businessHoursSchema],
  rules: {}, // placeholder for business logic
  // maxHours: Number, //! verify func of this prop.  Why not just sum hours?
  // nested resources?
};

export default locationSchema;
