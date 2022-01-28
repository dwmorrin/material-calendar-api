import { request } from "https";
import { URL } from "url";
import {
  addResultsToResponse,
  crud,
  query,
  respond,
  withResource,
} from "../../utils/crud";
import pool, {
  getUnsafeMultipleStatementConnection,
  inflate,
} from "../../utils/db";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { Request } from "express";
import { makeUsedHoursQuery } from "../project/project.helpers";

interface Equipment {
  id: number;
  quantity: number;
}

const reserveEquipment: EC = (req, res, next) => {
  const bookingId = res.locals.reservation.insertId;
  const equipment = req.body.equipment as Equipment[];
  if (!Array.isArray(equipment))
    return next("reservation form without equipment");
  if (!equipment.length) return next();
  pool.query(
    `REPLACE INTO equipment_reservation (
      equipment_id, booking_id, quantity
    ) VALUES ?`,
    [equipment.map(({ id, quantity }) => [id, bookingId, quantity])],
    addResultsToResponse(res, next)
  );
};

const deleteEquipment: EC = (req, res, next) => {
  const bookingId = res.locals.reservation.insertId;
  const equipment = req.body.equipment as Equipment[];
  // assumes reserveEquipment has already been called and checked isArray
  if (!equipment.length)
    pool.query(
      `DELETE FROM equipment_reservation
    WHERE booking_id = ?`,
      bookingId,
      addResultsToResponse(res, next)
    );
  else
    pool.query(
      `DELETE FROM equipment_reservation
    WHERE booking_id = ? AND equipment_id NOT IN (?)`,
      [bookingId, equipment.map(({ id }) => id)],
      addResultsToResponse(res, next)
    );
};

const editReservationResponse: EC = (req, res, next) => {
  // event reservation info has changed
  // reservation has changed
  res.status(201).json({
    data: {
      event: inflate(res.locals.event),
      reservation: inflate(res.locals.reservation),
      group: inflate(res.locals.group),
      project: inflate(res.locals.project),
    },
    context: req.query.context,
  });
  next();
};

const editReservationStack = [
  reserveEquipment,
  deleteEquipment,
  query({
    sql: "SELECT * FROM event_view WHERE id = ?",
    using: (req) => req.body.eventId,
    then: (results, _, res) => (res.locals.event = results[0]),
  }),
  query({
    sql: "SELECT * FROM reservation_view WHERE eventId = ? AND cancelation IS NULL",
    using: (req) => req.body.eventId,
    then: (results, _, res) => (res.locals.reservation = results[0]),
  }),
  query({
    sql: "SELECT * FROM project_group_view WHERE id = ?",
    using: (req) => req.body.groupId,
    then: (results, _, res) => (res.locals.group = results[0]),
  }),
  query({
    sql: "SELECT * FROM project_view WHERE id = ?",
    using: (req) => req.body.projectId,
    then: (results, _, res) => (res.locals.project = results[0]),
  }),
  editReservationResponse,
  useMailbox,
];

const getOne = crud.readOne(
  "SELECT * FROM reservation_view WHERE id = ?",
  (req) => Number(req.params.id)
);

const cancelReservation = query({
  sql: "UPDATE reservation SET ? WHERE id = ?",
  using: (req, res) => [
    {
      canceled: true,
      canceled_time: new Date(),
      canceled_user_id: res.locals.user.id,
      refund_request: req.body.refundApproved || req.body.refundRequest,
      refund_request_comment: req.body.refundApproved
        ? "Refund Granted Automatically"
        : req.body.refundComment,
      refund_approval_id: req.body.refundApproved ? res.locals.user.id : null,
      refund_response_time: req.body.refundApproved ? new Date() : null,
    },
    req.params.id,
  ],
});

// TODO: send updated project & group info (reserved hours may have changed)
const cancelResponse: EC = (_, res, next) => {
  res.status(201).json({
    data: {
      reservations: res.locals.reservations,
      events: res.locals.events,
    },
  });
  next();
};

const withUpdatedEventsAndReservations = [
  withResource("reservations", "SELECT * FROM reservation_view"),
  withResource("events", "SELECT * FROM event_view"),
];

const getMany = crud.readMany("SELECT * FROM reservation_view");

const byUserQuery = `SELECT
  res.*
FROM
  reservation_view res
  INNER JOIN project_group pg ON pg.id = res.groupId
  INNER JOIN project_group_user pgu ON pgu.project_group_id = pg.id
  INNER JOIN user u on u.id = pgu.user_id
WHERE u.id = ?`;

const getByUser = crud.readMany(byUserQuery, (_, res) => res.locals.user.id);

const refund = [
  query({
    sql: "UPDATE reservation SET ? WHERE id = ?",
    using: (req, res) => [
      {
        refund_approval_id: req.body.approved ? res.locals.user.id : null,
        refund_denial_id: req.body.approved ? null : res.locals.user.id,
      },
      Number(req.params.id),
    ],
  }),
  query({
    sql: "SELECT * FROM reservation_view",
    then: (results, _, res) => (res.locals.reservations = results),
  }),
  respond({
    status: 201,
    data: (_, res) => ({ reservations: res.locals.reservations }),
    callNext: true,
  }),
  useMailbox,
];

// .id is a url param and .equipment is dealt with separately
const getReservationFromBody = (req: Request) => ({
  event_id: req.body.eventId,
  contact_phone: req.body.phone,
  group_id: req.body.groupId,
  guests: req.body.guests,
  live_room: req.body.liveRoom,
  notes: req.body.notes,
  project_id: req.body.projectId,
  purpose: req.body.description,
});

const createOneStack = [
  // get corresponding virtual week from event ID
  query({
    sql: `
      SELECT vw.id, vw.start, vw.end
      FROM   event e
      JOIN   virtual_week vw USING (location_id)
      WHERE  e.id = ?
      AND    e.start BETWEEN vw.start AND vw.end
    `,
    using: (req) => req.body.eventId,
    then: (results, _, res) => (res.locals.virtualWeek = results[0]),
  }),
  // get used hours across project for the virtual week
  query({
    assert: (_, res) => {
      if (!res.locals.virtualWeek)
        throw [
          "Booking app is not setup for this event.", // friendly message
          "(Event is not part of a virtual week.)", // hint to admin/dev
        ].join(" ");
    },
    sql: makeUsedHoursQuery(),
    using: (req, res) => [
      req.body.projectId,
      req.body.locationId,
      res.locals.virtualWeek.start,
      res.locals.virtualWeek.end,
    ],
    then: (results, req, res) => {
      // admin can override this check
      if (res.locals.admin) return;
      // walk in project is not limited by hours
      const { projectId } = req.body;
      // TODO remove hardcoded walk-in project id
      if (projectId === 1) return;
      res.locals.usedHours = results[0].hours;
    },
  }),
  // get project virtual week hours
  query({
    sql: `
    SELECT hours
    FROM   project_virtual_week_hours
    WHERE  project_id = ?
    AND    virtual_week_id = ?`,
    using: (req, res) => [req.body.projectId, res.locals.virtualWeek.id],
    then: (results, req, res) => {
      // admin can override this check
      if (res.locals.admin) return;
      // walk in project is not limited by hours
      const { projectId } = req.body;
      // TODO remove hardcoded walk-in project id
      if (projectId === 1) return;
      res.locals.projectVirtualWeekHours = results[0].hours;
    },
  }),
  // validate and create reservation
  query({
    assert: (req, res) => {
      const { projectId } = req.body;
      const { usedHours, projectVirtualWeekHours } = res.locals;
      // admin can override this check
      if (res.locals.admin) return;
      // TODO remove hardcoded walk-in project id
      if (projectId === 1) return;
      if (usedHours === undefined) throw "Cannot find used hours";
      if (projectVirtualWeekHours === undefined) throw "Cannot find used hours";
      if (usedHours >= projectVirtualWeekHours)
        throw "Project does not have enough hours";
    },
    sql: "INSERT INTO reservation SET ?",
    using: (req) => [getReservationFromBody(req)],
    insertThen: (results, _, res) => (res.locals.reservation = results),
  }),
];

export const updateOne: EC = (req, res, next) => {
  // a bit of a hack, but this makes for the same as createOne
  res.locals.reservation.insertId = req.params.id;
  pool.query(
    "UPDATE reservation SET ? WHERE id = ?",
    [getReservationFromBody(req), Number(req.params.id)],
    addResultsToResponse(res, next, { one: true, key: "ignore" })
  );
};

// TODO untested
const removeOne: EC = (req, res, next) => {
  pool.query(
    "DELETE FROM reservation WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );
};

// class meetings: using same spreadsheet as event import, but with course & section info,
//                 reserve each event for the corresponding instructor

interface ClassMeetingInput {
  title: string; // event title, always "Class Meeting"
  locationId: string; // misnomer, should be locationTitle - see event import
  start: string; // event start time
  end: string; // event end time
  reservable: boolean; // event is reservable - not needed here
  course: string; // course.catalog_id
  section: string; // section.title
}

interface User {
  id: number;
  last_name: string; // for making group name, which will be reservation/event title
}

interface Course {
  id: number;
  catalog_id: string;
  title: string;
}

interface Section {
  id: number;
  title: string;
  instructor_id: number;
  course_id: number;
}

interface ProjectGroupUser {
  id: number;
  user_id: number;
}

interface Event {
  id: number;
  location_id: number;
  start: string;
  end: string;
}

interface Location {
  id: number;
  title: string;
}

const createManyClassMeetings: EC = (req, res, next) => {
  const input: ClassMeetingInput[] = req.body;
  if (!Array.isArray(input)) return next(new Error("Input must be an array"));
  const users: User[] = res.locals.users;
  if (!Array.isArray(users)) return next(new Error("Users must be an array"));
  const courses: Course[] = res.locals.courses;
  if (!Array.isArray(courses))
    return next(new Error("Courses must be an array"));
  const sections: Section[] = res.locals.sections;
  if (!Array.isArray(sections))
    return next(new Error("Sections must be an array"));
  const groups: ProjectGroupUser[] = res.locals.groups;
  if (!Array.isArray(groups)) return next(new Error("Groups must be an array"));
  const events: Event[] = res.locals.events;
  if (!Array.isArray(events)) return next(new Error("Events must be an array"));
  const locations: Location[] = res.locals.locations;
  if (!Array.isArray(locations))
    return next(new Error("Locations must be an array"));

  const reservations: { event_id: number; group_id: number; project_id: 2 }[] =
    [];
  const warnings: string[] = [];
  try {
    input.forEach(
      ({ locationId, start, course: catalogId, section: sectionTitle }) => {
        const makeErrorMessage = (what: string) =>
          `${what} not found for course ${catalogId}.${sectionTitle} in location ${locationId}`;
        const location = locations.find((l) => l.title === locationId);
        if (!location) throw makeErrorMessage("Location");
        const event = events.find(
          (e) => e.location_id === location.id && e.start === start
        );
        if (!event) throw makeErrorMessage("Event");
        const course = courses.find((c) => c.catalog_id === catalogId);
        if (!course) throw makeErrorMessage("Course");
        const section = sections.find(
          (s) => s.course_id === course.id && s.title === sectionTitle
        );
        if (!section) throw makeErrorMessage("Section");
        const user = users.find((u) => u.id === section.instructor_id);
        if (!user) throw makeErrorMessage("User");
        const group = groups.find((g) => g.user_id === user.id);
        if (!group) throw makeErrorMessage("Group");

        reservations.push({
          event_id: event.id,
          group_id: group.id,
          project_id: 2, // TODO remove hardcoded project id
        });
      }
    );
  } catch (e) {
    return next(e);
  }
  const connection = getUnsafeMultipleStatementConnection();
  connection.query(
    reservations.length
      ? "INSERT INTO reservation SET ?;".repeat(reservations.length)
      : "SELECT 1",
    reservations,
    (err) => {
      if (err) return next(err);
      res.locals.warnings = warnings;
      next();
    }
  );
};

const importClassMeetingReservations = [
  withResource("events", "SELECT * FROM event"),
  withResource("users", "SELECT * FROM user"),
  withResource("sections", "SELECT * FROM section"),
  withResource("courses", "SELECT * FROM course"),
  withResource(
    "groups",
    `
  SELECT pg.id, pgu.user_id
  FROM project_group pg
  JOIN project_group_user pgu ON pgu.project_group_id = pg.id
  WHERE pg.project_id = 2
  `
  ), // TODO remove hardcoded class meeting project id
  withResource("locations", "SELECT * FROM location"),
  createManyClassMeetings,
  respond({ status: 201, data: (_, res) => res.locals.warnings }),
];

interface Reservation {
  id: number;
  eventId: number;
  projectId: number;
  groupId: number;
  description: string;
  guests: string;
  liveRoom: boolean;
  phone: string;
  notes: string;
  equipment: { id: number; quantity: number }[];
}

interface FormUser {
  username: string;
  name: string;
  contact: string;
}

interface FormItem {
  sku: string;
  quantity: number;
}

interface ItemInfo {
  id: number;
  sku: string;
}

interface Form {
  reservationId: number;
  start: string;
  end: string;
  locationTitle: string;
  groupTitle: string;
  users: FormUser[];
  items: FormItem[];
}

interface ProjectGroup {
  id: number;
  title: string;
  members: {
    username: string;
    name: { first: string; last: string };
    email: string;
  }[];
}

const makeReservationForm: EC = (req, res, next) => {
  const event: Event = res.locals.event;
  const location: { title: string } = res.locals.location;
  const group: ProjectGroup = res.locals.group;
  const itemSkus: ItemInfo[] | undefined = res.locals.items;
  const reservation: Reservation = req.body.reservation;

  let items: FormItem[];
  try {
    if (!Array.isArray(itemSkus)) throw "No skus";
    items = itemSkus.map(({ id, sku }) => {
      const item = reservation.equipment.find((i) => i.id === id);
      if (!item) throw "No item";
      return {
        id,
        sku,
        quantity: item.quantity,
      };
    });
  } catch (e) {
    items = [];
  }

  const form: Form = {
    reservationId: reservation.id,
    start: event.start,
    end: event.end,
    locationTitle: location.title,
    groupTitle: group.title,
    users: group.members.map(({ username, name, email }) => ({
      username,
      name: `${name.first} ${name.last}`,
      contact: email,
    })),
    items,
  };
  res.locals.form = form;
  next();
};

const forwardRemoveOne: EC = (req, res, next) => {
  const { reservation } = req.body;
  if (!reservation)
    return res.status(400).json({ error: { message: "No reservation" } });
  const { id } = reservation as { id: number };
  if (!id || typeof id !== "number" || id < 1)
    return res
      .status(400)
      .json({ error: { message: "No reservation ID sent" } });
  const form: Form = {
    reservationId: id,
    start: "",
    end: "",
    locationTitle: "",
    groupTitle: "DELETE",
    users: [],
    items: [],
  };
  res.locals.form = form;
  next();
};

const forwardOne: EC = (req, res) => {
  const url = process.env.RESERVATION_FORWARD_URL;
  if (!url) return res.status(500).send("reservation forward URL not set");
  let forwardEnv;
  try {
    forwardEnv = JSON.parse(process.env.RESERVATION_FORWARD_JSON || "{}");
  } catch (e) {
    return res.status(500).send("reservation forward JSON not valid");
  }
  const { method }: { method: string } = req.body;
  const form: Form = res.locals.form;
  const formLogFormatted = `${form.reservationId}: ${form.groupTitle}, ${form.start}`;
  const body = JSON.stringify({
    ...forwardEnv,
    method,
    params: form,
  });

  // some memory to store the response
  let data = "";
  // common handlers to update/send the response or error
  const onData = (chunk: { toString: () => string }) =>
    (data += chunk.toString());
  const onError = (error: Error) => {
    console.log("FORWARD error:", formLogFormatted, error);
    if (!res.writableEnded) res.status(500).json({ error });
  };
  const onSuccess = () => {
    console.log("FORWARD OK:", formLogFormatted);
    if (!res.writableEnded) res.status(200).json({ data });
  };

  // make the request
  const fwd = request(url, { method: "POST" }, (fwdRes) => {
    if (fwdRes.statusCode === 302) {
      // follow temporary redirects
      const { location } = fwdRes.headers;
      if (!location) return onError(new Error("Redirect without location"));
      const url = new URL(location);
      const redirect = request(url, (redirectRes) => {
        redirectRes
          .on("error", onError)
          .on("data", onData)
          .on("end", onSuccess);
      });
      redirect.on("error", onError);
      redirect.end();
    } else {
      fwdRes.on("error", onError).on("data", onData).on("end", onSuccess);
    }
  });
  fwd.on("error", onError);
  fwd.write(body);
  fwd.end();
};

// const event: Event = res.locals.event;
// const location: { title: string } = res.locals.location;
// const group: ProjectGroup = res.locals.group;
// const items: ItemInfo[] = res.locals.items;
// const reservation: Reservation = req.body.reservation;
const forwardStack = [
  query({
    sql: "SELECT start, end, location_id AS locationId FROM event WHERE id = ?",
    using: (req) => req.body.reservation.eventId,
    then: (results, _, res) => (res.locals.event = results[0]),
  }),
  query({
    sql: "SELECT * FROM project_group_view WHERE id = ?",
    using: (req) => req.body.reservation.groupId,
    then: (results, _, res) => (res.locals.group = results[0]),
  }),
  query({
    sql: "SELECT title FROM location WHERE id = ?",
    using: (_, res) => res.locals.event.locationId,
    then: (results, _, res) => (res.locals.location = results[0]),
  }),
  query({
    assert: (req) => {
      const { reservation } = req.body;
      if (!reservation) throw "continue";
      const { equipment } = reservation;
      if (!Array.isArray(equipment) || !equipment.length) throw "continue";
    },
    sql: "SELECT id, sku FROM equipment_view WHERE id IN (?)",
    using: (req) => {
      // repeat of assert above, repeating for type safety
      const { reservation } = req.body;
      if (!reservation) throw "no reservation";
      const { equipment } = reservation;
      if (!Array.isArray(equipment)) throw "no equipment";
      return [equipment.map((e) => e.id)];
    },
    then: (results, _, res) => (res.locals.items = results),
  }),
  makeReservationForm,
  forwardOne,
];

export default {
  createOne: [...createOneStack, ...editReservationStack],
  forwardOne: [...forwardStack],
  forwardRemoveOne: [forwardRemoveOne, forwardOne],
  updateOne: [updateOne, ...editReservationStack],
  getOne,
  getByUser,
  getMany,
  importClassMeetings: importClassMeetingReservations,
  refund,
  cancelReservation: [
    cancelReservation,
    ...withUpdatedEventsAndReservations,
    cancelResponse,
    useMailbox,
  ],
  removeOne,
};
