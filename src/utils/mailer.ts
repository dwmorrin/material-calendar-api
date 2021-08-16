import nodemailer from "nodemailer";
import { Router } from "express";
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
  const mailbox: Mail[] = res.locals.mailbox;
  if (!Array.isArray(mailbox))
    return next(new Error("useMail called without mailbox on res.locals"));
  const mail = mailbox.pop();
  if (!mail) return; // DONE
  mailer.sendMail(mail, (err) => {
    if (err) return next(err);
    // recursively call sendMail until mailbox is empty
    useMailbox(req, res, next);
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
