import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express from "express";
import session from "express-session";
import equipmentRouter from "./resources/equipment/equipment.router";
import eventRouter from "./resources/event/event.router";
import locationRouter from "./resources/location/location.router";
import projectRouter from "./resources/project/project.router";
import reservationRouter from "./resources/reservation/reservation.router";
import userRouter from "./resources/user/user.router";
import { login } from "./utils/login";
import { logout } from "./utils/logout";

// configure express
const app = express();
app.set("port", process.env.PORT || 5000);

// configure session
if (
  typeof process.env.SESSION_SECRET !== "string" ||
  process.env.SESSION_SECRET.length < 24
) {
  console.error("session secret not set or too short, aborting");
  process.exit(1);
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// express middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded());

// application routing
app.post("/api/login", login);
app.post("/api/logout", logout);
app.use("/api/equipment", equipmentRouter);
app.use("/api/events", eventRouter);
app.use("/api/locations", locationRouter);
app.use("/api/projects", projectRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/users", userRouter);

// if nothing else...
app.use((req, res) => {
  console.log(`Unhandled request for ${req.originalUrl}`);
  res.status(500).json({ msg: "couldnt handle your request" });
});

export default app;
