import prompt from "prompt";

prompt.message = "";
prompt.start();

const schema = {
  properties: {
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
