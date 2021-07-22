import { Request, Response, NextFunction } from "express";

/**
 * If user is authenticated, adds res.locals.authId: string
 * {@link http://expressjs.com/en/api.html#res.locals}
 */
const authentication = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  // development use: hardcode an ID into the .env file
  if (process.env.NODE_ENV === "development") {
    if (process.env.NET_ID) {
      res.locals.authId = process.env.NET_ID;
      return next();
    } else return res.status(500).json({ error: "NET_ID not set in .env" });
  }
  // production use: selectabled auth method
  switch (process.env.AUTH_METHOD) {
    case "CUSTOM_HEADER": {
      if (typeof process.env.AUTH_CUSTOM_HEADER !== "string")
        return res
          .status(500)
          .json({ error: "authentication method misconfigured" });
      const authId = req.headers[process.env.AUTH_CUSTOM_HEADER.toLowerCase()];
      if (!authId) {
        return res.status(401).send("not authenticated");
      }
      res.locals.authId = authId;
      return next();
    }
    default:
      return res
        .status(500)
        .json({ error: "no authentication method selected" });
  }
};

export default authentication;
