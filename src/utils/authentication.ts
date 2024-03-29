import { EC } from "./types";

/**
 * If user is authenticated, adds res.locals.authId: string
 * {@link http://expressjs.com/en/api.html#res.locals}
 */
const authentication: EC = (req, res, next) => {
  // if the user has already been authenticated, pass through
  const session = req.session as { authId?: string };
  if (session.authId) {
    res.locals.authId = session.authId;
    return next();
  }
  switch (process.env.AUTH_METHOD) {
    // development: use an ID in the .env file
    case "DOT_ENV_AUTH_ID": {
      const authId = process.env.AUTH_ID;
      if (authId) {
        session.authId = authId;
        res.locals.authId = authId;
        return next();
      }
      return res.status(500).json({ error: "AUTH_ID not set in .env" });
    }
    // have the web server handle authentication and inject the authId into the request
    case "CUSTOM_HEADER": {
      if (typeof process.env.AUTH_CUSTOM_HEADER !== "string")
        return res
          .status(500)
          .json({ error: "authentication method misconfigured" });
      const authId = req.headers[process.env.AUTH_CUSTOM_HEADER.toLowerCase()];
      if (!authId || Array.isArray(authId)) {
        return res.status(401).send("not authenticated");
      }
      session.authId = authId;
      res.locals.authId = authId;
      return next();
    }
    default: {
      // including /login check so we can reuse this authentication method for /login
      if (req.originalUrl.startsWith("/login")) {
        // username & password
        if (req.method !== "POST") {
          return res
            .status(401)
            .json({ error: { message: "Send credentials" } });
        }
        const { username, password } = req.body;
        if (username && password) {
          return next("password");
        }
        return res.status(401).json({ error: { message: "Send credentials" } });
      }
      // trying to access a protected resource outside an auth session
      return res.status(401).send("not authenticated");
    }
  }
};

export default authentication;
