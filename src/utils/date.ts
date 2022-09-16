import { compareAsc, isAfter, isBefore, isToday, parse, set } from "date-fns";

interface DateInterval {
  start: Date;
  end: Date;
}

const sqlFormat = {
  date: "yyyy-MM-dd",
  time: "HH:mm:ss",
  datetime: "yyyy-MM-dd HH:mm:ss",
};

const isBetween = (date: Date, start: Date, end: Date) =>
  isAfter(date, start) && isBefore(date, end);

const isValidDateInterval = ({ start, end }: DateInterval): boolean =>
  compareAsc(start, end) < 1;

const parseSQLDate = (dateStr: string): Date =>
  parse(dateStr, sqlFormat.date, new Date());

const parseSQLDatetime = (dateStr: string): Date =>
  parse(dateStr, sqlFormat.datetime, new Date());

export const isTodaySQLDatetime = (dateStr: string): boolean =>
  isToday(parseSQLDatetime(dateStr));

// todo move hardcoded time period (8am to 8pm) to env
export const isWalkInPeriod = (): boolean => {
  const start = set(new Date(), {
    hours: 7,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  });
  const end = set(new Date(), {
    hours: 20,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const now = new Date();
  return isToday(now) && isBetween(now, start, end);
};

export const isValidSQLDateInterval = ({
  start,
  end,
}: {
  start: string;
  end: string;
}): boolean =>
  isValidDateInterval({
    start: parseSQLDate(start),
    end: parseSQLDate(end),
  });

export const isValidSQLDatetimeInterval = ({
  start,
  end,
}: {
  start: string;
  end: string;
}): boolean =>
  isValidDateInterval({
    start: parseSQLDatetime(start),
    end: parseSQLDatetime(end),
  });
