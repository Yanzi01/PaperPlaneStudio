// api/contact.js
import { MailerSend, EmailParams, Recipient } from "mailersend";

const ALLOWED_ORIGINS = new Set([
  "https://paper-plane-studio.vercel.app",      // your Vercel site
  "https://yanszi01.github.io",                 // your GitHub Pages domain if used
  "https://yanzi01.github.io",                  // add any other domains you serve from
  "http://localhost:8000"                       // local dev, if you test
]);

function setCors(res, origin) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "3600");
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { name, email, message, _hp } = req.body || {};
    if (_hp) return res.status(200).json({ ok: true }); // honeypot
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

    const ownerMsg = new EmailParams()
      .setFrom({ email: process.env.FROM_EMAIL, name: "Portfolio Contact" })
      .setTo([new Recipient(process.env.TO_EMAIL, "Owner")])
      .setReplyTo(email)
      .setSubject(`New contact from ${name}`)
      .setText(`From: ${name} <${email}>\n\n${message}`)
      .setHtml(`<p><b>Name:</b> ${escapeHtml(name)}</p>
                <p><b>Email:</b> ${escapeHtml(email)}</p>
                <hr><p>${escapeHtml(message).replace(/\n/g,"<br>")}</p>`);

    const ackMsg = new EmailParams()
      .setFrom({ email: process.env.FROM_EMAIL, name: "Paper Plane Studio" })
      .setTo([new Recipient(email, name)])
      .setSubject("Thanks for contacting Paper Plane Studio")
      .setText(`Hi ${name},\n\nThanks for reaching out! We'll get back to you shortly.`)
      .setHtml(`<p>Hi ${escapeHtml(name)},</p><p>Thanks for reaching out! We’ll get back to you shortly.</p>`);

    await mailerSend.email.send(ownerMsg);
    await mailerSend.email.send(ackMsg);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("MailerSend error:", err);
    return res.status(500).json({ ok: false, error: "Email failed" });
  }
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
