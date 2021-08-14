interface SectionKey {
  courseTitle: string;
  sectionTitle: string;
}

interface RosterKey extends SectionKey {
  netId: string;
}

interface ProjectKey extends SectionKey {
  projectTitle: string;
}

// just an odd sequence of characters, unlikely to be used in titles
const ifs = "|||";

export default {
  sectionProject: {
    make({ courseTitle, projectTitle, sectionTitle }: ProjectKey): string {
      return [projectTitle, courseTitle, sectionTitle].join(ifs);
    },
    parse(key: string): ProjectKey {
      const [projectTitle, courseTitle, sectionTitle] = key.split(ifs);
      return { projectTitle, courseTitle, sectionTitle };
    },
  },
  section: {
    make({ courseTitle, sectionTitle }: SectionKey): string {
      return [courseTitle, sectionTitle].join(ifs);
    },
    parse(key: string): SectionKey {
      const [courseTitle, sectionTitle] = key.split(ifs);
      return { courseTitle, sectionTitle };
    },
  },
  roster: {
    make({ courseTitle, sectionTitle, netId }: RosterKey): string {
      return [courseTitle, sectionTitle, netId].join(ifs);
    },
    parse(key: string): RosterKey {
      const [courseTitle, sectionTitle, netId] = key.split(ifs);
      return { courseTitle, sectionTitle, netId };
    },
  },
};
