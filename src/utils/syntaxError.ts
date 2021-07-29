import { EEH } from "./types";

/**
 * Catches JSON parse errors.
 * Use only to catch JSON errors in the request since it returns a 400 response.
 * (Server generated JSON errors should send a 500 response.)
 */
const syntaxError: EEH = (err, _, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).send({ message: "Invalid JSON" });
  }
  next(err);
};

export default syntaxError;
