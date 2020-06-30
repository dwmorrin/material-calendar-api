import { tsv } from "./csv";

const lineIsBlank = (line: string[]) => line.length === 1 && line[0] === "";
const lineIsNotBlank = (line: string[]) => !lineIsBlank(line);

/**
 * Produces 4 lists: users, courses, projects, roster records, and errors
 * @param rosterString tab separated values, newline separated records
 */
export const parseRoster = (rosterString: string) => {
  try {
    const rawParse = tsv(rosterString);
    return rawParse.filter(lineIsNotBlank).reduce(
      (lists, line, index) => {
        try {
          const record = new RosterRecord(line);
          lists.roster.push(record);
          if (!(record.student.id in lists.users))
            lists.users[record.student.id] = record.student;
          if (!(record.course.title in lists.courses))
            lists.courses[record.course.title] = record.course;
        } catch (error) {
          lists.errors.push(
            new Error(
              `In roster import, line ${
                index + 1
              } rejected. Line contents: ${JSON.stringify(line)}`
            )
          );
        }
        return lists;
      },
      {
        users: {} as { [k: string]: Student },
        courses: {} as { [k: string]: Course },
        roster: [] as RosterRecord[],
        errors: [] as Error[],
      }
    );
  } catch (error) {
    return {
      users: {},
      courses: {},
      roster: [],
      errors: [error],
    };
  }
};

export enum RosterFields {
  COURSE_TITLE,
  COURSE_CATALOG_ID,
  COURSE_SECTION,
  COURSE_INSTRUCTOR,
  STUDENT_NAME,
  STUDENT_ID,
  PROJECT_TITLE,
}

interface Course {
  title: string;
  catalogId: string;
  section: string;
  instructor: string;
  project: { title: string };
}
interface Student {
  name: {
    first: string;
    last: string;
  };
  id: string;
}
export interface RosterRecord {
  id: number;
  course: Course;
  student: Student;
}

export class RosterRecord implements RosterRecord {
  static url = "/api/roster";
  constructor(fields: string[]) {
    this.id = -1;
    const [last, first] = fields[RosterFields.STUDENT_NAME].split(", ");
    this.course = {
      title: fields[RosterFields.COURSE_TITLE],
      catalogId: fields[RosterFields.COURSE_CATALOG_ID],
      section: fields[RosterFields.COURSE_SECTION],
      instructor: fields[RosterFields.COURSE_INSTRUCTOR],
      project: { title: fields[RosterFields.PROJECT_TITLE] },
    };
    this.student = {
      name: { first, last },
      id: fields[RosterFields.STUDENT_ID],
    };
  }
}

export default RosterRecord;
