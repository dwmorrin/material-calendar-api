import mysql, { MysqlError } from "mysql";

/**
 * returns generic JSON response for MySQL errors for production
 * and the raw MySQL errors for development
 */
export const error500 = (rawDbError: MysqlError) =>
  process.env.NODE_ENV === "development"
    ? rawDbError
    : {
        error: {
          code: 500,
          message: "could not start session, try back later",
        },
      };

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

connection.connect((error) => {
  if (error) throw error;
});

export default connection;
