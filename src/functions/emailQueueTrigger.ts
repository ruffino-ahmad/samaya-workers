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
      subject: "Activate Your Acarain Account",
      plainText: `Thank you for registering at Acarain! Click the following link to activate your account: ${activationLink}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
            
            <!-- Header Logo (Teks Acarain) -->
            <div style="text-align: center; padding: 40px 20px 20px;">
              <h1 style="color: #F31260; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; border: 3px solid #F31260; display: inline-block; padding: 5px 20px; border-radius: 12px;">
                Acarain
              </h1>
            </div>

            <!-- Body Content -->
            <div style="padding: 10px 40px 40px; text-align: center;">
              <h2 style="color: #11181C; font-size: 24px; margin-bottom: 12px; font-weight: 700;">Activate Your Account</h2>
              <p style="color: #71717A; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Thank you for registering at Acarain! You're just one step away from completing your registration. Click the button below to verify your email and activate your account.
              </p>

              <!-- Tombol Aktivasi -->
              <a href="${activationLink}" 
                 style="display: inline-block; padding: 14px 36px; background-color: #F31260; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 14px;">
                Activate Now
              </a>

              <!-- Fallback Link -->
              <p style="color: #A1A1AA; font-size: 13px; line-height: 1.5; margin-top: 36px;">
                If the button above doesn't work, copy and paste the following link into your browser:<br>
                <a href="${activationLink}" style="color: #F31260; word-break: break-all; text-decoration: underline; margin-top: 5px; display: inline-block;">
                  ${activationLink}
                </a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px;">
            <p style="color: #A1A1AA; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Acarain. All rights reserved.
            </p>
          </div>
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
