import { compareAsc, isToday, parse } from "date-fns";

interface DateInterval {
  start: Date;
  end: Date;
}

const sqlFormat = {
  date: "yyyy-MM-dd",
  time: "HH:mm:ss",
  datetime: "yyyy-MM-dd HH:mm:ss",
};

const isValidDateInterval = ({ start, end }: DateInterval): boolean =>
  compareAsc(start, end) < 1;

const parseSQLDate = (dateStr: string): Date =>
  parse(dateStr, sqlFormat.date, new Date());

const parseSQLDatetime = (dateStr: string): Date =>
  parse(dateStr, sqlFormat.datetime, new Date());

export const isTodaySQLDatetime = (dateStr: string): boolean =>
  isToday(parseSQLDatetime(dateStr));

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
