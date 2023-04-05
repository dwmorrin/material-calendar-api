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
import { Request, Response } from "express";
import { makeUsedHoursQuery } from "../project/project.helpers";
import { isTodaySQLDatetime, isWalkInPeriod } from "../../utils/date";

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
      isAdmin: req.body.isAdmin,
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

const getCancellation = (req: Request, res: Response) => ({
  canceled: true,
  canceled_time: new Date(),
  canceled_user_id: res.locals.user.id,
  refund_request: req.body.refundApproved || req.body.refundRequest,
  refund_request_comment: req.body.refundApproved
    ? "Refund Granted Automatically"
    : req.body.refundComment,
  refund_approval_id: req.body.refundApproved ? res.locals.user.id : null,
  refund_response_time: req.body.refundApproved ? new Date() : null,
});

const cancelReservation = query({
  sql: "UPDATE reservation SET ? WHERE id = ?",
  using: (req, res) => [getCancellation(req, res), req.params.id],
});

interface ReservationCancelInfo {
  minutesSinceCreated: number; // for business logic
  hasStarted: number; // for business logic
  start: string; // formatted date & time string for email
  projectTitle: string; // for email
  location: string; // for email
}

const composeCancelEmail: EC = (req, res, next) => {
  const { myName, group, cancelReservationInfo } = res.locals;
  if (!Array.isArray(cancelReservationInfo))
    return next("Error: no reservation info");
  const { start, projectTitle, location } = cancelReservationInfo[0];
  const { refundApproved, refundRequest, refundComment } = req.body;
  const adminEmail =
    process.env.EMAIL_FROM || "Calendar Admin <admin@calendar.app>";
  const subject = "canceled a reservation for your group";
  const whatWhenWhere = `${projectTitle} on ${start} in ${location}`;
  const body = `${subject} for ${whatWhenWhere}`;
  const mail = [];
  const refundMessage = refundRequest
    ? " They requested that project hours be refunded. The request has been sent to the administrator."
    : " They did not request that project hours be refunded, so the hours have been forfeited.";
  mail.push({
    to: group.members,
    subject: `${myName} has ${subject}`,
    text: `You are receiving this because you are a member of ${
      group.title
    }. ${myName} has ${body}.${refundApproved ? "" : refundMessage}`,
  });
  if (!refundApproved && adminEmail && refundRequest)
    mail.push({
      to: adminEmail,
      subject: "Project Hour Refund Request",
      text: `${myName} is requesting a project hour refund for their booking: ${whatWhenWhere}. Message: ${
        refundComment || "(no message)"
      }`,
    });
  res.locals.mail = mail;
  next();
};

const cancelMail = [
  query({
    sql: `
    select title, group_concat(u.email) as members
    from user u
    join project_group_user pgu on pgu.user_id = u.id
    join project_group g on pgu.project_group_id = g.id
    where g.id = ?
    group by g.id
    `,
    using: (req) => req.body.groupId,
    then: (results, _, res) => (res.locals.group = results[0]),
  }),
  query({
    sql: `
    select concat_ws(' ', first_name, last_name) as myName
    from user where id = ?
    `,
    using: (_, res) => res.locals.user.id,
    then: (results, _, res) => (res.locals.myName = results[0].myName),
  }),
  composeCancelEmail,
];

const cancelManyReservations = [
  query({
    sql: `SELECT
     TIMESTAMPDIFF(MINUTE, r.created, NOW()) AS minutesSinceCreated,
     NOW() > e.start as hasStarted,
     DATE_FORMAT(e.start, '%b %e, %l:%i %p') as start,
     p.title as projectTitle,
     l.title as location
     FROM reservation r
     JOIN event e ON e.id = r.event_id
     JOIN project_group g ON g.id = r.group_id
     JOIN project p ON p.id = g.project_id
     JOIN location l ON l.id = e.location_id
     WHERE r.id IN (?)
     ORDER BY e.start
     `,
    using: (req) => [req.body.reservationIds],
    then: (results, _, res) => (res.locals.cancelReservationInfo = results),
  }),
  query({
    sql: `SELECT
      user_id AS userId
      FROM project_group_user
      WHERE project_group_id = ?`,
    using: (req) => req.body.groupId,
    then: (results, _, res) => (res.locals.groupUserIds = results),
  }),
  query({
    assert: (_, res) => {
      // RULE 0: admins can bypass the rules
      if (res.locals.admin) return;
      // RULE 1: user should be in the group
      const groupUserIds: { userId: number }[] = res.locals.groupUserIds;
      if (!groupUserIds.some(({ userId }) => userId === res.locals.user.id))
        throw "Cannot cancel: Not a member of the group.";
      // RULE 2: 5 minute creation grace period, otherwise start cannot have passed
      const reservations: ReservationCancelInfo[] =
        res.locals.cancelReservationInfo;
      if (
        reservations.some(
          ({ minutesSinceCreated, hasStarted }) =>
            hasStarted && minutesSinceCreated > 15
        )
      )
        throw "Cannot cancel: reservation is in progress.";
    },
    sql: "UPDATE reservation SET ? WHERE id IN (?)",
    using: (req, res) => [getCancellation(req, res), req.body.reservationIds],
  }),
];

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

const withUpdatedEventsAndReservations = [
  query({
    sql: byUserQuery,
    using: (_, res) => res.locals.user.id,
    then: (results, _, res) => (res.locals.reservations = results),
  }),
  query({
    sql: "SELECT * FROM event_view WHERE id IN (?)",
    using: (req) => [req.body.eventIds],
    then: (results, _, res) => (res.locals.events = results),
  }),
];

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
  // get event info
  query({
    sql: [
      "SELECT e.*, l.location FROM event e",
      "JOIN location l ON l.id = e.location_id WHERE e.id = ?",
    ].join(" "),
    using: (req) => req.body.eventId,
    then: (results, _, res) => {
      if (!results.length) throw "Invalid event ID";
      res.locals.event = results[0];
      const lockId: number | null = Number(res.locals.event.lock_user_id);
      if (isNaN(lockId)) throw "500";
      if (
        !res.locals.admin &&
        res.locals.event.lock_user_id !== res.locals.user.id
      )
        throw "Current user does not have the event lock and cannot make a reservation.";
    },
  }),
  // get corresponding virtual week from event ID
  query({
    sql: `
      SELECT vw.id, vw.start, vw.end
      FROM   event e
      JOIN   virtual_week vw USING (location_id)
      WHERE  e.id = ?
      AND    DATE(e.start) BETWEEN vw.start AND vw.end
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
      res.locals.event.location_id,
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
  // get project group
  query({
    sql: "SELECT * FROM project_group WHERE id = ?",
    using: (req) => req.body.groupId,
    then: (results, _, res) => {
      if (!results.length) throw "Invalid group ID";
      res.locals.projectGroup = results[0];
    },
  }),
  // get same day counts
  query({
    sql: [
      "SELECT count FROM reservation_same_day_count",
      "WHERE user_id = ? AND location = ?",
    ].join(" "),
    using: (_, res) => [res.locals.user.id, res.locals.event.location],
    then: (results, _, res) => {
      if (!results.length) res.locals.sameDayCount = 0;
      else res.locals.sameDayCount = results[0].count;
    },
  }),
  // validate and create reservation
  query({
    assert: (req, res) => {
      const { projectId } = req.body;
      const { usedHours, projectVirtualWeekHours, projectGroup } = res.locals;
      // admin can override this check
      if (res.locals.admin) return;
      // TODO remove hardcoded walk-in project id
      if (projectId === 1) {
        // assumes server time and bookable location time are the same.
        // checks if it is the same day.
        const { start } = res.locals.event;
        const sameDayCount = Number(res.locals.sameDayCount) || 0;
        const inPeriod = isWalkInPeriod();
        if (inPeriod && isTodaySQLDatetime(start) && sameDayCount < 2) return;
        else
          throw [
            "Cannot create same-day booking.",
            `Event start: ${start},`,
            `currently: ${new Date().toLocaleString()}.`,
            `In the walk in period? (8am-8pm) ${inPeriod ? "YES" : "NO"}`,
            `Already booked ${sameDayCount} in that location group.`,
          ].join(" ");
      }
      if (usedHours === undefined) throw "Cannot find used hours";
      if (projectVirtualWeekHours === undefined) throw "Cannot find used hours";
      //! deactivating this check
      if (usedHours >= projectVirtualWeekHours)
        console.error({
          projectId,
          usedHours,
          projectVirtualWeekHours,
          projectGroup,
          message: "Project does not have enough hours",
        });
      if (projectGroup.pending) throw "Group is pending";
      if (projectGroup.abandoned) throw "Group has been abandoned";
    },
    sql: "INSERT INTO reservation SET ?",
    using: (req) => [getReservationFromBody(req)],
    insertThen: (results, _, res) => (res.locals.reservation = results),
  }),
];

const updateOne: EC = (req, res, next) => {
  // a bit of a hack, but this makes for the same as createOne
  res.locals.reservation = { insertId: req.params.id };
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

interface FormUser {
  username: string;
  name: string;
  contact: string;
}

interface FormItem {
  sku: string;
  quantity: number;
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
  const items: FormItem[] = res.locals.items || [];
  const reservationId: number = req.body.primaryReservationId;

  const form: Form = {
    reservationId,
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

const forwardOne: EC = (_, res) => {
  const url = process.env.RESERVATION_FORWARD_URL;
  if (!url) return res.status(500).send("reservation forward URL not set");
  let forwardEnv;
  try {
    forwardEnv = JSON.parse(process.env.RESERVATION_FORWARD_JSON || "{}");
  } catch (e) {
    return res.status(500).send("reservation forward JSON not valid");
  }
  const form: Form = res.locals.form;
  const formLogFormatted = `${form.reservationId}: ${form.groupTitle}, ${form.start}`;
  const body = JSON.stringify({
    ...forwardEnv,
    method: "POST",
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
    if (!res.writableEnded)
      res.status(200).json({ data: { events: res.locals.eventViews } });
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
    assert: (_, res) => {
      if (!(res.locals.admin || res.locals.user.roles.includes("staff")))
        throw "Cannot complete request: unauthorized";
    },
    sql: `SELECT
        id,
        event_id AS eventId,
        group_id AS groupId
      FROM reservation WHERE id IN (?)`,
    using: (req) => [req.body.reservationIds],
    then: (results, _, res) => (res.locals.reservations = results),
  }),
  query({
    sql: `SELECT DISTINCT
        e.id,
        e.sku,
        er.quantity
      FROM equipment_reservation er JOIN equipment e on e.id = er.equipment_id
      WHERE er.booking_id IN (?)`,
    using: (req) => [req.body.reservationIds],
    then: (results, _, res) => (res.locals.items = results),
  }),
  query({
    sql: "SELECT start, end, location_id AS locationId FROM event WHERE id in (?)",
    using: (_, res) => [
      (res.locals.reservations as { eventId: number }[]).map(
        ({ eventId }) => eventId
      ),
    ],
    then: (results, _, res) => (res.locals.event = results[0]),
  }),
  query({
    assert: (_, res) => {
      const reservations: { groupId: number }[] = res.locals.reservations;
      if (!Array.isArray(reservations))
        throw "Internal error: reservations not an array.";
      if (reservations.length > 1) {
        const groupId = reservations[0].groupId;
        for (let i = 1; i < reservations.length; ++i)
          if (groupId !== reservations[i].groupId)
            throw "Cannot generate form automatically: multiple groups found.";
      }
    },
    sql: "SELECT * FROM project_group_view WHERE id = ?",
    using: (_, res) => res.locals.reservations[0].groupId,
    then: (results, _, res) => (res.locals.group = results[0]),
  }),
  query({
    assert: (_, res) => {
      if (!res.locals.group)
        throw "Cannot generate form automatically: no user associated with this reservation.";
    },
    sql: "SELECT title FROM location WHERE id = ?",
    using: (_, res) => res.locals.event.locationId,
    then: (results, _, res) => (res.locals.location = results[0]),
  }),
  query({
    sql: "SELECT * FROM event_view WHERE id IN (?)",
    using: (_, res) =>
      (res.locals.reservations as { eventId: number }[]).map(
        ({ eventId }) => eventId
      ),
    then: (results, _, res) => (res.locals.eventViews = results),
  }),
  query({
    sql: "UPDATE reservation SET checkin = NOW() WHERE id IN (?)",
    using: (req) => [req.body.reservationIds],
  }),
  makeReservationForm,
  forwardOne,
];

export default {
  checkIn: [...forwardStack],
  createOne: [...createOneStack, ...editReservationStack],
  updateOne: [updateOne, ...editReservationStack],
  getOne,
  getByUser,
  getMany,
  importClassMeetings: importClassMeetingReservations,
  refund,
  cancelManyReservations: [
    ...cancelManyReservations,
    ...withUpdatedEventsAndReservations,
    cancelResponse,
    ...cancelMail,
    useMailbox,
  ],
  cancelReservation: [
    cancelReservation,
    ...withUpdatedEventsAndReservations,
    cancelResponse,
    useMailbox,
  ],
  removeOne,
};
