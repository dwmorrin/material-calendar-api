import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import userRouter from "./models/user/user.router";
import dbConnect from "./utils/db";

dotenvExpand(dotenv.config({ path: ".env" }));

// MongoDB connection
dbConnect();

// configure express
const app = express();
app.set("port", process.env.PORT || 5000);

app.use(express.json());

app.use("/api/user", userRouter);

export default app;
