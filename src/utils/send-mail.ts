import transporter from "../config/mail.config";
import logger from "../config/logger.config";

interface EmailProps {
  toEmail: string;
  subject: string;
  emailBody: string;
}

export async function sendEmail({
  toEmail,
  subject,
  emailBody,
}: EmailProps): Promise<boolean> {
  try {
    const message = {
      from: process.env.EMAIL_USER || "natureayure@gmail.com",
      to: toEmail,
      subject: subject,
      html: emailBody,
    };

    const result = await transporter.sendMail(message);
    logger.info(`Email sent to ${toEmail}`);
    return !!result;
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
    throw new Error("Error in sending email");
  }
}
