import nodemailer from "nodemailer";
import { Request, Router } from "express";

//-------- mailer.controller ---- //

/**
 *
 * @param to list of receivers
 * @param subject subject line
 * @param text plain text body
 * @param html html email body
 */
function send({ to = "", subject = "", text = "", html = "" }) {
  const mail = {
    from: process.env.EMAIL_FROM || '"Booking App" <admin@booking.app>',
    to,
    subject,
    text,
  };
  nodemailer
    .createTransport({
      host: "localhost",
      port: Number(process.env.EMAIL_PORT) || 25,
      secure: false,
      tls: { rejectUnauthorized: false },
    })
    .sendMail(html ? { ...mail, html } : mail);
}

//----- mailer.router -----//
const router = Router();
router.post("/", (req: Request): void => send(req.body));
export default router;
