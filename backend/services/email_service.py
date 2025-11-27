"""
Email Service for sending verification and notification emails
Supports: Gmail, Zoho Mail, and other SMTP providers
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid, formatdate
from datetime import datetime

class EmailService:
    """Handle email sending via SMTP"""

    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.zoho.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'StockPulse')

        # Determine if using SSL or TLS
        self.use_ssl = (self.smtp_port == 465)

        # Check if email is configured
        self.is_configured = bool(
            self.smtp_username and
            self.smtp_password and
            len(self.smtp_username.strip()) > 0 and
            len(self.smtp_password.strip()) > 0
        )

        if self.is_configured:
            provider = "Zoho Mail" if "zoho" in self.smtp_host else "Gmail" if "gmail" in self.smtp_host else "SMTP"
            print("\n" + "="*80)
            print(f"📧 EMAIL SERVICE: ✅ ENABLED ({provider})")
            print(f"   SMTP Host: {self.smtp_host}:{self.smtp_port}")
            print(f"   Protocol: {'SSL' if self.use_ssl else 'STARTTLS'}")
            print(f"   From: {self.from_email}")
            print(f"   Username: {self.smtp_username}")
            print("="*80 + "\n")
        else:
            print("\n" + "="*80)
            print("📧 EMAIL SERVICE: ⚠️  DEV MODE")
            print("   Verification codes will be logged to console")
            print("   To enable real emails, set these environment variables:")
            print("     • SMTP_USERNAME=your-email@zohomail.com")
            print("     • SMTP_PASSWORD=your-app-password")
            print("   ")
            print("   How to get Zoho App Password:")
            print("     1. Enable 2FA on your Zoho account")
            print("     2. Go to: https://accounts.zoho.com/home#security/application")
            print("     3. Create app password for 'StockPulse'")
            print("     4. Use that password in SMTP_PASSWORD")
            print("="*80 + "\n")

    def send_email(self, to_email, subject, html_body, text_body=None):
        """Send email via SMTP with proper headers for deliverability"""
        try:
            if not self.is_configured:
                # DEV MODE: Just log
                print(f"\n📧 [DEV] Email to: {to_email}")
                print(f"   Subject: {subject}\n")
                return True

            # PRODUCTION MODE: Actually send email
            print(f"\n📧 Preparing to send email...")
            print(f"   To: {to_email}")
            print(f"   Subject: {subject}")
            print(f"   From: {self.from_email}")

            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            # ✅ Add headers to improve deliverability and avoid spam
            msg['Reply-To'] = self.from_email
            msg['X-Mailer'] = 'StockPulse Email System'
            msg['X-Priority'] = '1'
            msg['X-MSMail-Priority'] = 'High'
            msg['Importance'] = 'High'

            # Add Message-ID for better tracking
            msg['Message-ID'] = make_msgid(domain=self.from_email.split('@')[1])

            # Add Date header
            msg['Date'] = formatdate(localtime=True)

            # Attach text and HTML parts
            if text_body:
                msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))

            # Choose SSL or STARTTLS based on port
            if self.use_ssl:
                # SSL connection (port 465)
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    print(f"   Connecting via SSL...")
                    server.login(self.smtp_username, self.smtp_password)
                    print(f"   Logged in successfully")
                    server.send_message(msg)
                    print(f"   ✅ Email sent to SMTP server")
            else:
                # STARTTLS connection (port 587 or 25)
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    print(f"   Connecting via STARTTLS...")
                    server.starttls()
                    print(f"   Starting TLS...")
                    server.login(self.smtp_username, self.smtp_password)
                    print(f"   Logged in successfully")
                    server.send_message(msg)
                    print(f"   ✅ Email sent to SMTP server")

            print(f"✅ Email delivered successfully to {to_email}")
            print(f"   (Note: Sent to mail server, delivery to inbox depends on spam filters)\n")
            return True

        except smtplib.SMTPAuthenticationError as e:
            print(f"\n❌ SMTP Authentication Failed!")
            print(f"   Error: {e}")
            print(f"   Check your Zoho/Gmail app password is correct")
            print(f"   Generate new one at: https://accounts.zoho.com/home#security/application\n")
            return False
        except smtplib.SMTPRecipientsRefused as e:
            print(f"\n⚠️  Recipient Refused!")
            print(f"   Email: {to_email}")
            print(f"   Error: {e}")
            print(f"   This email address may not exist or is rejecting mail\n")
            return False
        except smtplib.SMTPException as e:
            print(f"\n❌ SMTP Error: {e}\n")
            return False
        except Exception as e:
            print(f"\n❌ Email send failed: {e}\n")
            if self.is_configured:
                import traceback
                traceback.print_exc()
            return False

    def send_otp_email(self, user_email, user_name, otp):
        """Send OTP for email verification"""
        subject = "🔐 Your StockPulse Verification Code"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; }}
                .content {{ padding: 40px 30px; }}
                .otp-box {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 48px; font-weight: bold; letter-spacing: 10px; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; font-family: 'Courier New', monospace; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3); }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                .info-box {{ background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #2196f3; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Verify Your Email</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">StockPulse Account Verification</p>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi {user_name},</h2>
                    <p>Thank you for registering with StockPulse! To complete your registration, please use this one-time verification code:</p>
                    
                    <div class="otp-box">
                        {otp}
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Important:</strong> This code will expire in <strong>5 minutes</strong>.
                    </div>
                    
                    <div class="info-box">
                        <strong>📌 Security Tips:</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Never share this code with anyone</li>
                            <li>StockPulse will never ask for your OTP via phone or email</li>
                            <li>If you didn't request this code, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">Once verified, you'll have access to:</p>
                    <ul style="line-height: 2;">
                        <li>📊 AI-Powered Stock Analysis</li>
                        <li>🔮 Price Predictions</li>
                        <li>💼 Portfolio Tracking</li>
                        <li>🔔 Smart Alerts</li>
                        <li>📰 Real-Time Market News</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>The StockPulse Team</strong></p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} StockPulse. All rights reserved.</p>
                    <p>This is an automated security email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Verify Your StockPulse Account
        
        Hi {user_name},
        
        Your verification code is: {otp}
        
        This code will expire in 5 minutes.
        
        Never share this code with anyone. If you didn't request this, please ignore this email.
        
        Best regards,
        The StockPulse Team
        
        © {datetime.now().year} StockPulse. All rights reserved.
        """

        # Show OTP in console for easy testing
        print("\n" + "🔐" * 40)
        print(f"📧 OTP EMAIL")
        print(f"👤 User: {user_name} ({user_email})")
        print(f"🔐 OTP CODE: {otp}")
        print(f"⏰ Expires: 5 minutes")
        print("🔐" * 40 + "\n")

        return self.send_email(user_email, subject, html_body, text_body)

    def send_welcome_email(self, user_email, user_name):
        """Send welcome email after verification - Optimized for inbox delivery"""
        subject = "🎉 Welcome to StockPulse - You're All Set!"

        html_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
                body {{ margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; }}
                .content {{ padding: 40px 30px; }}
                .feature {{ background: #f0fdf4; padding: 20px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #10b981; }}
                .feature strong {{ color: #059669; display: block; margin-bottom: 5px; font-size: 16px; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Email Verified!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Welcome to StockPulse</p>
                </div>
                <div class="content">
                    <h2 style="color: #10b981; margin-top: 0;">Welcome, {user_name}!</h2>
                    <p style="font-size: 16px;">Your email has been successfully verified. You now have <strong>full access</strong> to all premium features:</p>
                    
                    <div class="feature">
                        <strong>📊 AI Stock Analysis</strong>
                        Get advanced technical analysis with 28+ indicators including RSI, MACD, Bollinger Bands, and more.
                    </div>
                    
                    <div class="feature">
                        <strong>🔮 Price Predictions</strong>
                        LSTM-powered predictions for intraday, weekly, monthly, and long-term timeframes.
                    </div>
                    
                    <div class="feature">
                        <strong>💼 Portfolio Tracking</strong>
                        Monitor your investments in real-time with profit/loss tracking and performance analytics.
                    </div>
                    
                    <div class="feature">
                        <strong>🔔 Smart Alerts</strong>
                        Get instant notifications when stocks hit your target prices or technical indicators.
                    </div>
                    
                    <div class="feature">
                        <strong>📰 Market News</strong>
                        Stay updated with the latest market trends, corporate actions, and stock-specific news.
                    </div>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <p style="font-size: 18px; margin-bottom: 20px;">Ready to start analyzing?</p>
                        <a href="http://localhost:5173/dashboard" class="cta-button">🚀 Go to Dashboard</a>
                    </div>
                    
                    <p style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 3px solid #0ea5e9; margin-top: 30px;">
                        <strong>💡 Pro Tip:</strong> Start by searching for popular stocks like RELIANCE, TCS, or INFY to see the AI in action!
                    </p>
                    
                    <p style="margin-top: 30px;">Need help? Feel free to explore our features or reach out to our support team.</p>
                    
                    <p style="margin-top: 30px;">Happy investing!<br><strong>The StockPulse Team</strong></p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} StockPulse. All rights reserved.</p>
                    <p>Questions? Contact us at support@stockpulse.com</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Welcome, {user_name}!
        
        Your email is verified! You now have full access to:
        
        📊 AI Stock Analysis - 28+ technical indicators
        🔮 Price Predictions - Multi-timeframe forecasts
        💼 Portfolio Tracking - Real-time monitoring
        🔔 Smart Alerts - Price & technical notifications
        📰 Market News - Latest updates & trends
        
        Ready to start? Visit: http://localhost:5173/dashboard
        
        Happy investing!
        The StockPulse Team
        
        © {datetime.now().year} StockPulse. All rights reserved.
        """

        print(f"\n🎉 Sending welcome email to {user_name} ({user_email})\n")

        return self.send_email(user_email, subject, html_body, text_body)


# Initialize email service
email_service = EmailService()