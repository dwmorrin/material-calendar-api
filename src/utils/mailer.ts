import nodemailer from "nodemailer";
import { Request, Response, Router } from "express";

//-------- mailer.controller ---- //

const sendMail = (req: Request, res: Response): void => {
  console.log(req.body);
  send(req.body.to, req.body.subject, req.body.text, req.body.html);
};

// async..await is not allowed in global scope, must use a wrapper
function send(to: string, subject: string, text: string, html?: string) {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 3025,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "user", // generated ethereal user
      pass: "password", // generated ethereal password
    },
  });

  /*   const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  }); */

  if (html) {
    // send mail with defined transport object
    transporter.sendMail({
      from: '"Booking App" <admin@booking.app>', // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: html, // html body
    });
  } else
    transporter.sendMail({
      from: '"Booking App" <admin@booking.app>', // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text,
    });
}

//----- mailer.router -----//
const router = Router();
router.post("/", sendMail);
export default router;
