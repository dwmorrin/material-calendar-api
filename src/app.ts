import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import express from "express";
import mongoose from "mongoose";

dotenvExpand(dotenv.config({ path: ".env" }));

// MongoDB connection
const mongoUrl = process.env.DATABASE_URL;
if (!mongoUrl) {
  console.error("No path to database set, aborting");
  process.exit(1);
}
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then()
  .catch(console.error);

// configure express
const app = express();
app.set("port", process.env.PORT || 3000);

app.get("/*", (req, res) => {
  console.log(`${req.method} ${req.path}`);
  return res.status(200).json({ message: "OK" });
});

export default app;
