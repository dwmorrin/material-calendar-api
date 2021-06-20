/**
 * These functions adapt the structure of the existing database to the
 * data structures of the models on the client app.
 */

const roleToInt = (role: string): number => {
  switch (role) {
    case "admin":
      return 2;
    case "user":
      return 3;
    case "staff":
      return 4;
    default:
      return 3;
  }
};

interface User {
  username: string;
  name: { first: string; middle: string; last: string };
  contact: { email: string[] };
  roles: string[];
  restriction: number;
  // projects -> requires more complex handler
}

interface LegacyUser {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  user_type: number;
  restriction: number;
}

export const adapter = (user: User): LegacyUser => ({
  user_id: user.username,
  first_name: user.name.first,
  middle_name: user.name.middle,
  last_name: user.name.last,
  email: user.contact.email[0],
  user_type: roleToInt(user.roles[0]),
  restriction: user.restriction,
});

export default adapter;
