import prompt from "prompt";

prompt.message = "";
prompt.start();

// check for 4 digit year, month range 01-12, and day range 01-31
const sqlDateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1,2]\d|3[0,1])$/;

const schema = {
  properties: {
    semesterTitle: {
      description: "semester title?",
      required: true,
    },
    semesterStart: {
      description: "semester start (yyyy-mm-dd)?",
      required: true,
      pattern: sqlDateRegex,
    },
    semesterEnd: {
      description: "semester end (yyyy-mm-dd)?",
      required: true,
      pattern: sqlDateRegex,
    },
    user: {
      description: "username?",
      required: true,
    },
    password: {
      description: "password?",
      hidden: true,
      required: true,
    },
    first: {
      description: "user first name?",
      required: true,
    },
    last: {
      description: "user last name?",
      required: true,
    },
    email: {
      description: "user email?",
      required: true,
    },
  },
};

export { prompt, schema };
