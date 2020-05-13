import mongoose from "mongoose";
import { User, defaultUser } from "../models/user/user.model";

const databaseInit = (): void => {
  // check for any minimal data needed to be present and create if needed
  (async (): Promise<void> => {
    const numberOfUsers = await User.find().countDocuments().exec();
    if (numberOfUsers === 0) {
      const user = await User.create(defaultUser);
      console.log("No users found.  Created one.", { user });
    }
  })();
};

const connect = (url = process.env.DATABASE_URL): void => {
  if (!url) {
    console.error("No path to database set, aborting");
    process.exit(1);
  }
  const development = process.env.NODE_ENV === "development";
  mongoose.set("debug", development);
  mongoose
    .connect(url, {
      useCreateIndex: true,
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(databaseInit)
    .catch(console.error);
};

export default connect;
