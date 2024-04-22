// @ts-nocheck

import { SendMailClient } from "zeptomail";

// For CommonJS
// var { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.com/";
const token = process.env.MAIL_TOKEN || "YOUR_MAIL_TOKEN";

let client = new SendMailClient({ url, token });

export async function sendVerificationEmail({ email, name, token }: { email: string; name: string; token: string }) {
  try {
    const res = await client.sendMail({
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
    });
    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}
export async function sendPasswordResetEmail({ email, name, token }: { email: string; name: string; token: string }) {
  try {
    const res = await client.sendMail({
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
      subject: "Reset your password | Next-Chess",
      htmlbody:
        "<h1>Reset your password</h1><p>Click the link below to reset your password (or copy and paste it into your browser)</p><a href='https://next-chess.dev/auth/reset-password?token=" +
        token +
        "'>Reset Password</a><p>If you didn't request a password reset, please ignore this email</p><p>This link will expire in 24 hours</p>",
    });
  } catch (e) {}
}
