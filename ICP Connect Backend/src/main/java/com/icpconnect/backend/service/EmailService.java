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
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0D1117; color: #E6EDF3; padding: 20px; text-align: center; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #30363D;">
                    <div style="margin-bottom: 24px; padding: 20px 0;">
                        <h1 style="color: #58A6FF; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">ICP Connect</h1>
                        <p style="color: #8B949E; margin: 4px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">%s</p>
                    </div>
                    
                    <div style="background-color: #1C2128; border: 1px solid #30363D; border-radius: 8px; padding: 32px 16px; margin: 0 0 24px;">
                        <p style="font-size: 16px; margin: 0 0 20px; color: #8B949E; line-height: 1.5;">
                            Please use the following 6-digit code to %s. 
                            This code will expire in <strong style="color: #E6EDF3;">5 minutes</strong>.
                        </p>
                        
                        <div style="display: inline-block; background-color: #0D1117; padding: 12px 16px; border-radius: 8px; border: 1px solid #30363D; margin: 8px 0; max-width: 100%%; box-sizing: border-box;">
                            <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #58A6FF; margin-right: -10px; word-break: break-all;">%s</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 32px; border-top: 1px solid #30363D; padding-top: 24px;">
                        <p style="font-size: 12px; color: #6E7681; margin: 0;">
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

    public void sendDonationThankYouEmail(String to, String donorName, String amount) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("A Special Thank You from the Developer ❤️");

            String htmlMsg = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0D1117; color: #E6EDF3; padding: 40px; text-align: center; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #30363D;">
                    <div style="margin-bottom: 32px;">
                        <div style="background-color: #1C2128; display: inline-block; padding: 16px; border-radius: 50%%; border: 2px solid #58A6FF; margin-bottom: 16px;">
                            <span style="font-size: 40px;">❤️</span>
                        </div>
                        <h1 style="color: #E6EDF3; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">A Message from the Developer</h1>
                    </div>
                    
                    <div style="background-color: #1C2128; border: 1px solid #30363D; border-radius: 8px; padding: 32px; margin: 24px 0; text-align: left;">
                        <p style="font-size: 16px; color: #E6EDF3; margin: 0 0 16px;">Dear %s,</p>
                        
                        <p style="font-size: 15px; line-height: 1.6; color: #8B949E; margin: 0 0 20px;">
                            I am truly grateful for your generous support! Your contribution of <strong style="color: #58A6FF;">Rs. %s</strong> helps me maintain and improve **ICP Connect** for everyone.
                        </p>
                        
                        <p style="font-size: 15px; line-height: 1.6; color: #8B949E; margin: 0 0 20px;">
                            It means the world to see students like you giving back to the community and supporting independent development.
                        </p>
                        
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #30363D;">
                            <p style="font-size: 15px; font-weight: 700; color: #58A6FF; font-style: italic; margin: 0;">- The Developer</p>
                            <p style="font-size: 12px; color: #6E7681; margin: 4px 0 0;">ICP Connect Engine</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 32px; padding-top: 24px;">
                        <p style="font-size: 12px; color: #6E7681; margin: 0;">
                            This is an automated confirmation of your donation. Thank you for being part of the journey.
                        </p>
                    </div>
                </div>
            """.formatted(donorName, amount);

            helper.setText(htmlMsg, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send Donation Thank You email", e);
        }
    }
}
