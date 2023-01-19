import { PoolConnection } from "mysql";
import { EC } from "../../utils/types";
import { inflate, useTransaction } from "../../utils/db";

// check that a positive number was submitted
const lockAssert: EC = (req, res, next) => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId) || eventId < 1) return next("invalid event ID");
  res.locals.eventId = eventId;
  next();
};

const getLock: EC = (_, res, next) => {
  const connection: PoolConnection = res.locals.connection;
  connection.query(
    "SELECT lock_user_id FROM event WHERE id = ?",
    res.locals.eventId,
    (err, results) => {
      if (err || !(Array.isArray(results) && results.length))
        return next("Could not get lock");
      res.locals.lockUserId = results[0].lock_user_id;
      next();
    }
  );
};

enum LockStatus {
  LockLock,
  LockUnlocked,
  UnlockUnlocked,
  UnlockLockedNoKey,
  UnlockLockedWithKey,
}

const tryLock: EC = (req, res, next) => {
  const lockUserId: number | null = res.locals.lockUserId;
  if (/\/lock$/.test(req.path)) {
    // req.path === "/:id/lock"
    if (lockUserId) {
      res.locals.lockStatus = LockStatus.LockLock;
    } else res.locals.lockStatus = LockStatus.LockUnlocked;
  } else {
    // req.path === "/:id/unlock"
    if (!lockUserId) {
      res.locals.lockStatus = LockStatus.UnlockUnlocked;
    } else if (lockUserId !== res.locals.user.id) {
      res.locals.lockStatus = LockStatus.UnlockLockedNoKey;
    } else res.locals.lockStatus = LockStatus.UnlockLockedWithKey;
  }
  next();
};

// pre-transaction commit
const examineLockStatus: EC = (_, res, next) => {
  const connection: PoolConnection = res.locals.connection;
  const status: LockStatus = res.locals.lockStatus;
  switch (status) {
    case LockStatus.LockLock:
    case LockStatus.UnlockUnlocked:
    case LockStatus.UnlockLockedNoKey:
      // no database action required for this cases
      next();
      break;
    case LockStatus.LockUnlocked:
      connection.query(
        "UPDATE event SET lock_user_id = ?, locked_time = NOW() WHERE id = ?",
        [res.locals.user.id, res.locals.eventId],
        (err) => {
          if (err) return next(err);
          next();
        }
      );
      break;
    case LockStatus.UnlockLockedWithKey:
      connection.query(
        "UPDATE event SET lock_user_id = NULL, locked_time = NULL WHERE id = ?",
        [res.locals.eventId],
        (err) => {
          if (err) return next(err);
          next();
        }
      );
      break;
    default:
      next("Unknown event lock state");
  }
};

const getEvent: EC = (_, res, next) => {
  const connection: PoolConnection = res.locals.connection;
  connection.query(
    "SELECT * FROM event_view WHERE id = ?",
    [res.locals.eventId],
    (err, results) => {
      if (err) return next(err);
      res.locals.event = inflate(results[0]);
      next();
    }
  );
};

// post transaction
const respond: EC = (_, res, next) => {
  const status: LockStatus = res.locals.lockStatus;
  switch (status) {
    case LockStatus.LockLock:
    case LockStatus.UnlockUnlocked:
    case LockStatus.UnlockLockedNoKey:
    case LockStatus.LockUnlocked:
    case LockStatus.UnlockLockedWithKey:
      return res.status(200).json({ data: { event: res.locals.event } });
    default:
      next("Unknown event lock state");
  }
};

export const lockHandler = [
  lockAssert,
  ...useTransaction([getLock, tryLock, examineLockStatus, getEvent], [respond]),
];
