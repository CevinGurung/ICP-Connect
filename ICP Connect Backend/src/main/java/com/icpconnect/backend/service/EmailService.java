package com.icpconnect.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender javaMailSender;

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendOtpEmail(String to, String otp, String purpose) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("ICP Connect - Your " + purpose + " OTP");

            String processName = purpose.equals("Registration") ? "Secure Registration" : "Account Login";
            String actionVerb = purpose.equals("Registration") ? "complete your registration" : "verify your identity";

            String htmlMsg = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0D1117; color: #E6EDF3; padding: 40px; text-align: center; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #30363D;">
                    <div style="margin-bottom: 24px;">
                        <h1 style="color: #58A6FF; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">ICP Connect</h1>
                        <p style="color: #8B949E; margin: 4px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">%s</p>
                    </div>
                    
                    <div style="background-color: #1C2128; border: 1px solid #30363D; border-radius: 8px; padding: 32px; margin: 24px 0;">
                        <p style="font-size: 16px; margin: 0 0 20px; color: #8B949E;">
                            Please use the following 6-digit code to %s. 
                            This code will expire in <strong style="color: #E6EDF3;">5 minutes</strong>.
                        </p>
                        
                        <div style="display: inline-block; background-color: #0D1117; padding: 16px 32px; font-size: 36px; font-weight: 700; letter-spacing: 12px; border-radius: 6px; border: 1px solid #30363D; color: #58A6FF; margin: 8px 0;">
                            %s
                        </div>
                    </div>
                    
                    <div style="margin-top: 32px; border-top: 1px solid #30363D; padding-top: 24px;">
                        <p style="font-size: 13px; color: #6E7681; margin: 0;">
                            If you did not initiate this request, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            """.formatted(processName, actionVerb, otp);

            helper.setText(htmlMsg, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send HTML OTP email", e);
        }
    }
}
