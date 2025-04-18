import Mailgen from "mailgen";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "NaturaAyur",
    link: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

export function generateVerifiedEmailBody(
  userName: string,
  token: string
): string {
  return mailGenerator.generate({
    body: {
      name: userName,
      intro: "Welcome to NaturaAyur! We're very excited to have you on board.",
      action: {
        instructions:
          "To get started with NaturaAyur, please click here: (This link will expire in 10 minutes)",
        button: {
          color: "#22BC66",
          text: "Confirm your account",
          link: `${frontendUrl}/verify/${token}`,
        },
      },
      outro: "Need help? Contact our support team.",
    },
  });
}

export function generateResetPasswordEmailBody(
  userName: string,
  token: string
): string {
  return mailGenerator.generate({
    body: {
      name: userName,
      intro:
        "You have received this email because a password reset request for your account was received.",
      action: {
        instructions:
          "Click the button below to reset your password: (This link will expire in 10 minutes)",
        button: {
          color: "#DC4D2F",
          text: "Reset your password",
          link: `${frontendUrl}/reset-password/${token}`,
        },
      },
      outro:
        "If you did not request a password reset, no further action is required on your part.",
    },
  });
}

// Export as a module
export default {
  generateVerifiedEmailBody,
  generateResetPasswordEmailBody,
};
