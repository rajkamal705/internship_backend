import User from "../models/User.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from "bcryptjs";

// forgot password:
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "user not found" });

        // Generate token:
        var resetToken = crypto.randomBytes(32).toString('hex');

        // hashed token:
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest("hex");
        const expiryTime = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = expiryTime;
        await user.save();

        // update link:
        const resetLink = `https://internship-project-noos.vercel.app/reset-password/${resetToken}`;
        // const resetLink = `https://stayindia.vercel.app/reset-password/${resetToken}`;

        // send mail:
        // Create a transporter object
        const transporter = nodemailer.createTransport({
            // host: 'sandbox.smtp.mailtrap.io',
            // port: 587,
            service: 'Gmail',
            auth: {
                user: 'raj.kamal@yendigital.com',
                pass: 'pdkltbdkoeviqvsa',
            }
        });

        // Configure the mailoptions object
        const mailOptions = {
            from: 'StayIndia <no-reply@stayindia.com>',
            to: user.email,
            subject: 'Reset Your Password',
            html: `
               <h3>Password Reset</h3>
               <p>Click the link below to reset password</p>
               <a href="${resetLink}">${resetLink}</a>
               <p>This link will expire in 1 hour.</p>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Reset email sent successfully" });

    } catch (err) {
        next(err);
    }
}


// reset password:
export const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token is invalid or expired" });
        }

        const salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        next(err);
    }
}