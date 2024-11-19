import express from "express";
import cors from 'cors';
import 'dotenv/config';
import bodyParser from "body-parser";
import { MongoClient,ServerApiVersion,ObjectId } from "mongodb";
const app = express();

app.use(cors());
app.use(bodyParser.json());

//const dbURILocal = "mongodb://localhost:27017/igs_sv";
const dbURI = `mongodb://${process.env.DB_USR}:${process.env.DB_PWD}@${process.env.DB_HST}:${process.env.DB_PORT}/${process.env.DB_NAM}`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(dbURI,  {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);

app.post('/api/v1/auth/login',async(req,res)=>{
    try{
        const {
          body: {email,password}
        } = req;

        if(email && password){
            console.log("in auth/login ",email,password);
            await client.connect();
            const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
            const user = await coll.findOne({"Email":email});
            console.log("found user",user);
            if(user){
                if(password===user.Password){
                    delete user.Password;
                    delete user._id;
                    return res.status(200).json({"Status":"OK","Data":user});;
                }else{
                    return res.status(200).json({"Status":"Err","Data":"Wrong Password."});;    
                }
                
            }else{
                return res.status(200).json({"Status":"Err","Data":"User with the email was not found.."});;
            }            
        }else{
            return res.status(200).json({"Status":"Err","Data":"User with the email/password was not found.."});
        }

    }catch(err){
        console.log("Error in auth/login",err);
        res.status(200).json({"Status":"Error","Data":"Error in auth/login"});
    }finally{
        await client.close();
    }
});

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

// app.post('/api/v1/auth/register',(req,res)=>{
// });

app.listen(process.env.PORT,()=>{
    console.log("SV-Auth-Microservice listening on ",process.env.PORT);
});

