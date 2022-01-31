/* eslint-disable no-console */
import nodemailer from "nodemailer";
import { EC } from "./types";

// feel free to replace this with a better logging function
// just adding a timestamp
const logError = (err: Error | string): void =>
  console.error(new Date().toLocaleString(), err);

interface Mail {
  to: string;
  subject: string;
  text: string;
}

const mailer = nodemailer.createTransport({
  host: "localhost",
  port: Number(process.env.EMAIL_PORT) || 25,
  secure: false,
  tls: { rejectUnauthorized: false },
});

const sendMail = (mail: Mail[]) => {
  const envelope = mail.pop();
  const from = process.env.EMAIL_FROM || "Calendar Admin <admin@calendar.app>";
  if (envelope)
    mailer.sendMail({ ...envelope, from }, (err) => {
      if (err) return logError(err);
      sendMail(mail);
    });
};

// must be placed **last**.  does not call next
// TODO check if we can use sockets to alert client on failure
export const useMailbox: EC = (req) => {
  const mail: Mail | Mail[] = req.body.mail;
  if (!Array.isArray(mail) && !mail)
    return logError("useMailbox called without mail in request body");
  // filters out empty "to" strings
  sendMail((Array.isArray(mail) ? mail : [mail]).filter(({ to }) => to));
};
