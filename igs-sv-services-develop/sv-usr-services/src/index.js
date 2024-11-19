import express from "express";
import cors from 'cors';
import 'dotenv/config';
import bodyParser from "body-parser";

//import v1Router from './v1/routes/index.js';
import userRouter from "./v1/routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("SV-User-Microservice..Thought of the day - The only failure is not trying..");
});

app.use("/api/v1/users", userRouter);

app.listen(process.env.PORT,()=>{
    console.log("SV-User-Microservice listening on ",process.env.PORT);
});
