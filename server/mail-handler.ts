// @ts-nocheck

import { SendMailClient } from "zeptomail";

// For CommonJS
// var { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.com/";
const token = process.env.MAIL_TOKEN || "YOUR_MAIL_TOKEN";

let client = new SendMailClient({ url, token });

const ADDRESSES = {
  noreply: {
    address: "noreply@next-chess.dev",
    name: "Next-Chess.dev",
  },
};

export async function sendVerificationEmail({ email, name, token }: { email: string; name: string; token: string }) {
  let sent = false;
  client
    .sendMail({
      from: {
        address: "noreply@next-chess.dev",
        name: "noreply",
      },
      to: [
        {
          email_address: {
            address: email,
            name: name,
          },
        },
      ],
      subject: "Verify your email address | Next-Chess",
      htmlbody:
        "<h1>Verify your email address</h1><p>Click the link below to verify your email address (or copy and paste it into your browser)</p><a href='https://next-chess.dev/auth/verify-email?token=" +
        token +
        "'>Verify Email</a><p>If you don't have an account with Next-Chess.dev, please ignore this email</p><p>This verification link will expire in 24 hours</p>",
    })
    .then((res: any) => {
      sent = true;
    })
    .catch((err: any) => {
      console.log(err);
      console.log(err.error.details);
      return false;
    });
  return sent;
}
