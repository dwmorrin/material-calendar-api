import nodemailer from "nodemailer";
import { Request, Response, Router } from "express";

//-------- mailer.controller ---- //

function send(req: Request, res: Response) {
  const { to = "", subject = "", text = "", html = "" } = req.body;
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
    .sendMail(html ? { ...mail, html } : mail, (error, info) => {
      if (error) res.status(500).json({ error });
      else res.status(201).json({ info });
    });
}

//----- mailer.router -----//
const router = Router();
router.post("/", send);
export default router;
