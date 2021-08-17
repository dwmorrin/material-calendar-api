import nodemailer from "nodemailer";
import { NextFunction, Router } from "express";
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

// must be placed **last**.  does not call next unless there's an error.
export const useMailbox: EC = (req, res, next) => {
  const mail: Mail[] = req.body.mail;
  if (!Array.isArray(mail))
    return next("useMail called without mail in request body");
  res.locals.mailbox = mail;
  sendMail(mail, next);
};

const sendMail = (mail: Mail[], next: NextFunction) => {
  const envelope = mail.pop();
  if (!envelope) return; // DONE
  mailer.sendMail(envelope, (err) => {
    if (err) return next(err);
    sendMail(mail, next);
  });
};

//-------- mailer.controller ---- //

const send: EC = (req, res) => {
  const { to = "", subject = "", text = "", html = "" } = req.body;
  const mail = {
    from: process.env.EMAIL_FROM || '"Booking App" <admin@booking.app>',
    to,
    subject,
    text,
  };
  mailer.sendMail(html ? { ...mail, html } : mail, (error, info) => {
    if (error) res.status(500).json({ error });
    else res.status(201).json({ data: info });
  });
};

//----- mailer.router -----//
const router = Router();
router.post("/", send);
export default router;
