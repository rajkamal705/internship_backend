import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return next(createError(400, "All fields are required"));
        }

        // Role-based required fields
        // if (role === 'broker') {
        //     if (!phone || !city || !country) {
        //         return next(createError(400, "Phone, city, and country are required for brokers"));
        //     }
        // }

        const existingUser = await User.findOne({ email });
        if (existingUser) return next(createError(409, "Email already registered"));

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const newUser = new User({
            ...req.body,
            password: hash
        })

        // const newUser = new User({
        //     username,
        //     email,
        //     password: hash,
        //     role,
        //     ...(role === "broker" && { phone, city, country }),
        // });

        await newUser.save();
        res.status(201).json("user created successfully");
    } catch (error) {
        console.error("Backend Register Error:", error);
        next(createError(500, "Internal server error"));
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(createError(400, "invalid credentials"));
        }

        // check user exist
        const user = await User.findOne({ email });
        if (!user) return next(createError(404, 'user not found'));

        // check password correct
        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordCorrect) return next(createError(404, "wrong password"));

        // Generate JWT token with user ID and role
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT,
            { expiresIn: "1d" }
        );

        const { password: _, role, ...otherDetails } = user._doc;

        res
            .cookie("access_token", token, {
                httpOnly: true
            })
            .status(200)
            .json({token, details: otherDetails, role: role });
    } catch (error) {
        next(error);
    }
}