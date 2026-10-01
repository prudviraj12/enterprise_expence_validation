import { NotificationChannel } from "@prisma/client";
import nodemailer from "nodemailer";
import { config } from "../config.js";
import { prisma } from "../db.js";

let transporter: nodemailer.Transporter | undefined;

function getTransporter(): nodemailer.Transporter | undefined {
  if (!config.SMTP_HOST) return undefined;
  transporter ??= nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined
  });
  return transporter;
}

export async function notifyUser(userId: string, type: string, message: string): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, message, channel: NotificationChannel.IN_APP }
  });
  const mailer = getTransporter();
  if (!mailer) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (user) {
    await mailer.sendMail({ from: config.SMTP_FROM, to: user.email, subject: type, text: message });
  }
}