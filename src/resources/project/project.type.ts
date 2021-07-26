interface ProjectAllotment {
  locationId: number;
  virtualWeekId: number;
  start: string;
  end: string;
  hours: number;
}

interface ProjectLocationHours {
  locationId: number;
  hours: number;
}

export interface Project {
  [k: string]: unknown;
  id: number;
  title: string;
  course: { id: number; title: string; sections: string[] };
  start: string;
  end: string;
  reservationStart: string;
  allotments: ProjectAllotment[];
  locationHours: ProjectLocationHours[];
  open: boolean;
  groupSize: number;
  groupAllottedHours: number;
}
