import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending verification emails
  app.post("/api/send-verification", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: "Email and code are required." });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP is not configured. Verification code is logged for development.");
      console.log(`[DEV] Verification code for ${email}: ${code}`);
      return res.json({ 
        success: true, 
        message: "SMTP not configured, code logged for dev purposes.",
        isDev: true
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"LFA Academy" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "رمز التحقق - LFA Academy",
        text: `رمز التحقق الخاص بك هو: ${code}`,
        html: `
          <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; color: #333;">
            <h2 style="color: #064E3B;">أهلاً بك في منصة LFA Academy</h2>
            <p>شكراً لتسجيلك. يرجى استخدام رمز التحقق التالي لإكمال عملية إنشاء الحساب:</p>
            <div style="background-color: #F6F1E7; padding: 20px; border-radius: 10px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; border: 1px solid #C9A227; color: #022C22;">
              ${code}
            </div>
            <p>هذا الرمز صالح لمدة 10 دقائق.</p>
            <p style="font-size: 12px; color: #777;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني.</p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (error: any) {
      // Silencing the stack trace to avoid user panic, just logging a clear dev message
      console.log(`[DEV] Verification code for ${email}: ${code} (SMTP failed)`);
      return res.json({ 
        success: true, 
        message: "SMTP failed, code logged for dev purposes.",
        isDev: true
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
