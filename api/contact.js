// api/contact.js
import { MailerSend, EmailParams, Recipient } from "mailersend";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

    const ownerMsg = new EmailParams()
      .setFrom({ email: process.env.FROM_EMAIL, name: "Portfolio Contact" })
      .setTo([new Recipient(process.env.TO_EMAIL, "You")])
      .setReplyTo(email)
      .setSubject(`New contact from ${name}`)
      .setText(`From: ${name} <${email}>\n\n${message}`)
      .setHtml(`<p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <hr><p>${message.replace(/\n/g, "<br>")}</p>`);

    const ackMsg = new EmailParams()
      .setFrom({ email: process.env.FROM_EMAIL, name: "Paper Plane Studio" })
      .setTo([new Recipient(email, name)])
      .setSubject("Thanks for contacting Paper Plane Studio")
      .setText(`Hi ${name},\n\nThanks for reaching out! We'll get back to you shortly.`)
      .setHtml(`<p>Hi ${name},</p><p>Thanks for reaching out! We’ll get back to you shortly.</p>`);

    await mailerSend.email.send(ownerMsg);
    await mailerSend.email.send(ackMsg);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("MailerSend error:", err);
    return res.status(500).json({ ok: false, error: "Email failed" });
  }
}
