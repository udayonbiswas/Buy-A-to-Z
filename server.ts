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

  // 📧 Email & 📱 SMS Notification Endpoints
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;

    try {
      const emailUser = process.env.EMAIL_USER?.trim();
      const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

      if (!emailUser || !emailPass) {
        throw new Error("SMTP configuration missing (EMAIL_USER/PASS)");
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
      });

      await transporter.sendMail({
        from: `"Buy A to Z Support" <${emailUser}>`,
        to,
        subject,
        html,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Email notification failed:", error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message,
      });
    }
  });

  app.post("/api/send-otp", async (req, res) => {
    const { to, code, fullName } = req.body;
    const isEmail = to.includes('@');

    try {
      if (isEmail) {
        // 1. Try sending via Email (Nodemailer/SMTP)
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

        if (!emailUser || !emailPass) {
          throw new Error("SMTP configuration missing (EMAIL_USER/PASS)");
        }

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: emailUser, pass: emailPass },
        });

        await transporter.sendMail({
          from: `"Buy A to Z Support" <${emailUser}>`,
          to,
          subject: `${code} - ভেরিফিকেশন কোড (Buy A to Z)`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #f85606; text-align: center;">Buy A to Z</h2>
              <p>হ্যালো ${fullName || 'User'},</p>
              <p>আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিচের ৬ অক্ষরের ভেরিফিকেশন কোডটি ব্যবহার করুন:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f85606; padding: 15px; background: #fff5f0; border: 1px dashed #f85606; border-radius: 5px; text-align: center; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #666; font-size: 13px;">এই কোডটি পরবর্তী ১০ মিনিটের জন্য কার্যকর থাকবে। আপনি যদি এই অনুরোধটি না করে থাকেন, তবে সাধারণভাবেই এই ইমেইলটি এড়িয়ে যান।</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">© 2026 Buy A to Z Ecommerce. All rights reserved.</p>
            </div>
          `,
        });
      } else {
        // 2. Try sending via SMS (Vonage / Nexmo)
        const vonageKey = process.env.VONAGE_API_KEY;
        const vonageSecret = process.env.VONAGE_API_SECRET;
        const vonageFrom = process.env.VONAGE_FROM || "BuyAtoZ";

        // Professional formatting for SMS
        const digits = to.replace(/\D/g, '');
        let formattedTo = digits;
        
        if (digits.length === 11 && digits.startsWith('01')) {
          formattedTo = `88${digits}`;
        } else if (digits.length === 10 && digits.startsWith('1')) {
          formattedTo = `880${digits}`;
        } else if (digits.startsWith('880') && digits.length === 13) {
          formattedTo = digits;
        }

        if (vonageKey && vonageSecret) {
          console.log(`Sending Vonage SMS to: ${formattedTo}`);
          const { Vonage } = await import("@vonage/server-sdk");
          // @ts-ignore
          const vonage = new Vonage({ apiKey: vonageKey, apiSecret: vonageSecret });
          
          await vonage.sms.send({
            to: formattedTo,
            from: vonageFrom,
            text: `Buy A to Z: Your verification code is ${code}.`
          });
        } 
        // 3. Fallback to Twilio
        else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          console.log(`Sending Twilio SMS to: +${formattedTo}`);
          const twilio = (await import("twilio")).default;
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          
          await client.messages.create({
            body: `Buy A to Z: Your verification code is ${code}.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+${formattedTo}`
          });
        }
        else {
          console.warn("No SMS Gateway configured. Sending to Simulation Mode.");
          throw new Error("SMS গেটওয়ে কনফিগার করা নেই।");
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Notification failed:", error.message);
      
      // If everything fails, we tell the frontend it's "Simulation Mode" 
      // so the developer can still see the code for testing.
      res.status(500).json({ 
        success: false, 
        error: error.message,
        isDevMissing: error.message.includes("missing") || error.message.includes("গেটওয়ে") || error.message.includes("configuration"),
        suggestedAction: "Please set API keys in Settings > Secrets for real SMS/Email."
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
