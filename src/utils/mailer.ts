/* eslint-disable no-console */
import nodemailer from "nodemailer";
import { EC } from "./types";

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
  if (envelope)
    mailer.sendMail(envelope, (err) => {
      if (err) return console.error(err);
      sendMail(mail);
    });
};

// must be placed **last**.  does not call next
// TODO check if we can use sockets to alert client on failure
export const useMailbox: EC = (req) => {
  const mail: Mail | Mail[] = req.body.mail;
  if (!Array.isArray(mail) && !mail)
    return console.error("useMailbox called without mail in request body");
  // filters out empty "to" strings
  sendMail((Array.isArray(mail) ? mail : [mail]).filter(({ to }) => to));
};
