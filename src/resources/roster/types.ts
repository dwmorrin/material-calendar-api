export interface RosterRecordInput {
  Course: string;
  Catalog: string;
  Section: string;
  Instructor: string;
  Student: string;
  NetID: string;
  Restriction: string;
  Project: string;
}

export interface Section {
  id?: number;
  title: string;
  instructor: string;
  course: {
    id?: number;
    title: string;
  };
}

export interface User {
  id?: number;
  username: string;
  name: { first: string; last: string };
  restriction: number;
  groupId?: number;
}

export interface Course {
  id?: number;
  title: string;
  catalogId: string;
}

export type CourseRecord = { title: string; catalog_id: string };
export type SectionRecord = {
  title: string;
  instructor: string;
  course_id: number;
};
export type ProjectSection = { project_id: number; section_id: number };
export type UserRecord = {
  first_name: string;
  last_name: string;
  user_id: string;
  restriction: number;
};

export interface ProjectBase {
  id?: number;
  title: string;
  sectionIds: number[];
}

export interface Project extends ProjectBase {
  section: {
    id?: number;
    title: string;
  };
  course: {
    id?: number;
    title: string;
  };
}

export interface RosterUpdates {
  courses: string[];
  sections: string[];
  users: string[];
}

export interface RosterInserts extends RosterUpdates {
  sectionProjects: string[];
  projects: string[];
  roles: string[];
  rosterRecords: string[];
  walkInGroups: string[];
}

export type RosterInputHashTable = {
  course: Record<string, Course>;
  project: Record<string, Project>;
  rosterRecord: Record<string, true>;
  section: Record<string, Section>;
  sectionProject: Record<string, true>;
  user: Record<string, User>;
};

export interface ProjectRecord {
  title: string;
  start: string;
  end: string;
  book_start: string;
  group_hours: number;
  group_size: number;
  open: boolean;
}
