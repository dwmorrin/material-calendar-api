import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import eventRouter from "./models/event/event.router";
import locationRouter from "./models/resource/location.router";
import projectRouter from "./models/project/project.router";
import userRouter from "./models/user/user.router";
import dbConnect from "./utils/db";

dotenvExpand(dotenv.config({ path: ".env" }));

// MongoDB connection
dbConnect();

// configure express
const app = express();
app.set("port", process.env.PORT || 5000);

app.use(express.json());

app.use("/api/events", eventRouter);
app.use("/api/locations", locationRouter);
app.use("/api/projects", projectRouter);
app.use("/api/users", userRouter);

export default app;
