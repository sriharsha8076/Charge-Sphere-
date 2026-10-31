package com.evcharging.userservice.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for generating, delivering, and validating One-Time Passwords (OTP)
 * via SMTP email using Spring Mail.
 */
@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);
    private static final long OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${spring.mail.username:sriharsha8076@gmail.com}")
    private String senderEmail;

    // Cache holding active OTPs: key = lowercase email, value = OtpEntry
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    private static class OtpEntry {
        final String otp;
        final long expiresAt;

        OtpEntry(String otp, long expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }

    public EmailOtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Generate a 6-digit OTP, cache it with a 5-minute expiry, and dispatch
     * a branded HTML email via SMTP.
     */
    public void sendOtp(String recipientEmail) throws Exception {
        String normalizedEmail = recipientEmail.toLowerCase().trim();
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        long expiresAt = System.currentTimeMillis() + OTP_VALIDITY_MS;

        otpCache.put(normalizedEmail, new OtpEntry(otp, expiresAt));
        log.info("Generated OTP for [{}] (valid for 5 minutes)", normalizedEmail);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(senderEmail, "ChargeSphere Security");
        helper.setTo(normalizedEmail);
        helper.setSubject("ChargeSphere — Verification Code: " + otp);

        String htmlBody = buildHtmlEmail(otp);
        helper.setText(htmlBody, true);

        mailSender.send(message);
        log.info("Successfully dispatched OTP email to [{}]", normalizedEmail);
    }

    /**
     * Verify whether the provided OTP is valid for the given email.
     * Consumes the OTP if valid to prevent replay attacks.
     */
    public boolean verifyOtp(String recipientEmail, String inputOtp) {
        if (recipientEmail == null || inputOtp == null) {
            return false;
        }

        String normalizedEmail = recipientEmail.toLowerCase().trim();
        OtpEntry entry = otpCache.get(normalizedEmail);

        if (entry == null) {
            log.warn("No OTP found for [{}]", normalizedEmail);
            return false;
        }

        if (System.currentTimeMillis() > entry.expiresAt) {
            otpCache.remove(normalizedEmail);
            log.warn("OTP for [{}] has expired", normalizedEmail);
            return false;
        }

        boolean matches = entry.otp.equals(inputOtp.trim());
        if (matches) {
            otpCache.remove(normalizedEmail);
            log.info("OTP verified successfully for [{}]", normalizedEmail);
            return true;
        } else {
            log.warn("Invalid OTP attempt for [{}]", normalizedEmail);
            return false;
        }
    }

    private String buildHtmlEmail(String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0f1e; color: #f3f4f6; }
                .container { max-width: 540px; margin: 40px auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(34, 197, 94, 0.2); }
                .brand-title { color: #22c55e; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
                .brand-sub { color: #9ca3af; font-size: 13px; margin-top: 6px; }
                .content { padding: 36px 32px; text-align: center; }
                .lead { font-size: 16px; color: #e5e7eb; margin: 0 0 24px 0; line-height: 1.5; }
                .otp-box { background: rgba(34, 197, 94, 0.08); border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; margin: 28px 0; display: inline-block; }
                .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #4ade80; font-family: 'Courier New', monospace; margin: 0; padding-left: 12px; }
                .note { font-size: 13px; color: #9ca3af; line-height: 1.6; margin: 20px 0 0; }
                .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid rgba(255,255,255,0.05); }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 class="brand-title">&#9889; ChargeSphere</h1>
                  <div class="brand-sub">Intelligent EV Charging & Grid Platform</div>
                </div>
                <div class="content">
                  <p class="lead">Use the following One-Time Password (OTP) to complete your account registration:</p>
                  <div class="otp-box">
                    <div class="otp-code">%s</div>
                  </div>
                  <p class="note">
                    &#9201; This verification code expires in <strong>5 minutes</strong>.<br>
                    If you did not request this code, you can safely ignore this email.
                  </p>
                </div>
                <div class="footer">
                  &copy; 2026 ChargeSphere Platform &bull; SOA Architecture System &bull; Vijayawada Smart Grid
                </div>
              </div>
            </body>
            </html>
            """.formatted(otp);
    }
}
