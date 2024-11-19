import express from "express";
import cors from 'cors';
import 'dotenv/config';
import bodyParser from "body-parser";

import adminRouter from "./v1/routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("SV-Admin-Microservice..");
});

app.use("/api/v1/admin", adminRouter);

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
    // Check if the error is a JSON parsing error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      // Handle JSON parsing error
      res.status(400).json({ error: 'Invalid JSON in body params..' });
    } else {
      // Pass the error to the default Express error handler
      next(err);
    }
  });
  
  // Default error handling middleware
  app.use((err, req, res, next) => {
    // Handle other errors
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

app.listen(process.env.PORT,()=>{
    console.log("SV-Admin-Microservice listening on ",process.env.PORT);
});


