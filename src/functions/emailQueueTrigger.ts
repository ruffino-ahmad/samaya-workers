import { app, InvocationContext } from "@azure/functions";
import { EmailClient } from "@azure/communication-email";
import dotenv from "dotenv";
dotenv.config();

const client = new EmailClient(process.env.ACS_CONNECTION_STRING as string);

interface EmailJobPayload {
  toEmail: string;
  activationLink: string;
}

export async function emailQueueTrigger(
  queueItem: EmailJobPayload,
  context: InvocationContext,
): Promise<void> {
  context.log("Job diterima:", queueItem);

  const { toEmail, activationLink } = queueItem;

  const message = {
    senderAddress: process.env.ACS_SENDER_ADDRESS as string,
    content: {
      subject: "Aktivasi Akun Kamu",
      plainText: `Klik link berikut untuk aktivasi akun: ${activationLink}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>Aktivasi Akun</h2>
          <p>Klik tombol di bawah untuk mengaktifkan akun kamu:</p>
          <a href="${activationLink}"
             style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
            Aktivasi Sekarang
          </a>
        </div>
      `,
    },
    recipients: { to: [{ address: toEmail }] },
  };

  try {
    const poller = await client.beginSend(message);
    const result = await poller.pollUntilDone();
    context.log("Status pengiriman:", result.status);
  } catch (err) {
    context.error("Gagal kirim email:", err);
    throw err;
  }
}

app.storageQueue("emailQueueTrigger", {
  queueName: "email-activation-queue",
  connection: "AzureWebJobsStorage",
  handler: emailQueueTrigger,
});
