import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoute from "./routes/user.js";
import authRoute from "./routes/auth.js";

const app = express();
dotenv.config();

const port = process.env.PORT;

// connect to mongodb
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to mongodb");
    } catch (error) {
        throw error;
    }
}

mongoose.connection.on('connected', () => console.log("connected"));
mongoose.connection.on('disconnected', () => console.log("disconnected"));

// middlewares:
app.use(cors({
    origin: 'https://internship-project-noos.vercel.app',  // your frontend URL
    credentials: true                 // allow sending cookies
}));

// app.use(cors({
//     credentials: true
// }));

app.use(cookieParser());
app.use(express.json());

// routes:
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);

app.use((err, req, res, next) => {
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "something went wrong";
    return res.status(errorStatus).json({
        success: false,
        status: errorStatus,
        message: errorMessage,
        // stack: err.stack,
    })
})

app.listen(port, () => {
    connect();
    console.log(`server is running on port ${port}`);
})