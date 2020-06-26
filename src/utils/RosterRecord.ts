import { tsv } from "./csv";

const lineIsBlank = (line: string[]) => line.length === 1 && line[0] === "";
const lineIsNotBlank = (line: string[]) => !lineIsBlank(line);

export const parseRoster = (rosterString: string) => {
  const rawParse = tsv(rosterString);
  return rawParse.filter(lineIsNotBlank).map((line, index) => {
    try {
      return new RosterRecord(line);
    } catch (error) {
      throw new Error(
        `In roster import, line ${
          index + 1
        } rejected. Line contents: <<<${line.toString()}>>>, error message: ${JSON.stringify(
          error
        )}`
      );
    }
  });
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

export interface RosterRecord {
  course: {
    title: string;
    catalogId: string;
    section: string;
    instructor: string;
    project: { title: string };
  };
  student: {
    name: {
      first: string;
      last: string;
    };
    id: string;
  };
}

export class RosterRecord implements RosterRecord {
  constructor(fields: string[]) {
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
