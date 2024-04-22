"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const zeptomail_1 = require("zeptomail");
// For CommonJS
// var { SendMailClient } = require("zeptomail");
const url = "api.zeptomail.com/";
const token = process.env.MAIL_TOKEN || "YOUR_MAIL_TOKEN";
let client = new zeptomail_1.SendMailClient({ url, token });
async function sendVerificationEmail({ email, name, token }) {
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
            htmlbody: "<h1>Verify your email address</h1><p>Click the link below to verify your email address (or copy and paste it into your browser)</p><a href='https://next-chess.dev/auth/verify-email?token=" +
                token +
                "'>Verify Email</a><p>If you don't have an account with Next-Chess.dev, please ignore this email</p><p>This verification link will expire in 24 hours</p>",
        });
        if (res.status === 200) {
            return true;
        }
        return false;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}
exports.sendVerificationEmail = sendVerificationEmail;
