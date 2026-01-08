import nodemailer from 'nodemailer';

export class MailService {
    private static transporter: any;

    static async init() {
        if (this.transporter) return;

        try {
            // Check if we have real SMTP config, else fallback to Ethereal
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || "smtp.gmail.com",
                    port: parseInt(process.env.SMTP_PORT || "465"),
                    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                console.log(`MailService: Initialized with ${process.env.SMTP_HOST || 'Gmail'} (${process.env.SMTP_USER})`);
            } else {
                // Generate test SMTP service account from ethereal.email
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log('MailService: Initialized with Ethereal (Test Mode)');
                console.log(`Ethereal Login: ${testAccount.user} / ${testAccount.pass}`);
            }
        } catch (error) {
            console.error('MailService: Failed to init', error);
        }
    }

    static async sendTaskAssignment(toEmail: string, taskTitle: string, taskLink: string) {
        try {
            if (!this.transporter) await this.init();

            const info = await this.transporter.sendMail({
                from: `"Monocle" <${process.env.SMTP_USER || 'notify@monocle.app'}>`,
                to: toEmail,
                subject: `New Task Assigned: ${taskTitle}`,
                text: `You have been assigned a new task: ${taskTitle}.\nView here: ${taskLink}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2>New Task Assignment</h2>
                        <p>You have been assigned to: <strong>${taskTitle}</strong></p>
                        <p>Please log in to Monocle to view details and update progress.</p>
                        <a href="${taskLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">View Task</a>
                    </div>
                `,
            });

            console.log("Mail sent: %s", info.messageId);
            if (this.transporter.options.host === "smtp.ethereal.email") {
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            }
            return info;
        } catch (error) {
            console.error('MailService: Send failed', error);
        }
    }

    static async sendTeamInvite(toEmail: string, teamName: string, inviteLink: string) {
        try {
            if (!this.transporter) await this.init();

            const info = await this.transporter.sendMail({
                from: `"Monocle" <${process.env.SMTP_USER || 'notify@monocle.app'}>`,
                to: toEmail,
                subject: `Invitation to join team: ${teamName}`,
                text: `You have been invited to join the team "${teamName}" on Monocle. Join here: ${inviteLink}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2>Team Invitation</h2>
                        <p>You have been invited to join the team <strong>${teamName}</strong> on Monocle.</p>
                        <p>Click the button below to accept the invitation and get started.</p>
                        <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">Join Team</a>
                    </div>
                `,
            });

            console.log("Mail sent: %s", info.messageId);
            if (this.transporter.options.host === "smtp.ethereal.email") {
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            }
            return info;
        } catch (error) {
            console.error('MailService: Invite send failed', error);
        }
    }

    static async sendVerificationEmail(toEmail: string, verificationLink: string) {
        try {
            if (!this.transporter) await this.init();

            const fromEmail = process.env.SMTP_USER || 'notify@monocle.app';
            const info = await this.transporter.sendMail({
                from: `"Monocle" <${fromEmail}>`,
                to: toEmail,
                subject: 'Verify your Monocle account',
                text: `Welcome to Monocle! Please verify your account by clicking this link: ${verificationLink}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; color: #333;">
                        <h2 style="color: #000;">Welcome to Monocle!</h2>
                        <p>We're excited to have you on board. Please verify your email address to get started:</p>
                        <div style="margin: 30px 0;">
                            <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="font-size: 12px; color: #666; word-break: break-all;">${verificationLink}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                `,
            });

            console.log("Verification mail sent: %s", info.messageId);
            return info;
        } catch (error) {
            console.error('MailService: Verification send failed', error);
        }
    }

    static async sendPasswordResetEmail(toEmail: string, resetLink: string) {
        try {
            if (!this.transporter) await this.init();

            const fromEmail = process.env.SMTP_USER || 'notify@monocle.app';
            const info = await this.transporter.sendMail({
                from: `"Monocle" <${fromEmail}>`,
                to: toEmail,
                subject: 'Reset your Monocle password',
                text: `You requested a password reset. Click this link to set a new password: ${resetLink}. If you didn't request this, ignore this email.`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; color: #333;">
                        <h2 style="color: #000;">Password Reset Request</h2>
                        <p>You requested to reset your password. Click the button below to set a new one:</p>
                        <div style="margin: 30px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="font-size: 12px; color: #666; word-break: break-all;">${resetLink}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #999;">This link will expire in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
                    </div>
                `,
            });

            console.log("Reset mail sent: %s", info.messageId);
            return info;
        } catch (error) {
            console.error('MailService: Reset send failed', error);
        }
    }
}
