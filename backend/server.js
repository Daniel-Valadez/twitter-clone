import express from "express"; 
import dotenv from "dotenv"; 

import authRoutes from "./routes/auth.routes.js"; 
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config(); 

const app = express(); 

const PORT = process.env.PORT || 5000; 

app.use(express.json({ limit: "5mb" })); //middleware to parse the request body. 
app.use(express.urlencoded({extended: true})) //to parse form data (req.body)l; 

app.use(cookieParser()); 

app.use("/api/auth", authRoutes); 

app.listen(PORT, (req, res) => {
  console.log("app is listening on", PORT); 
  connectMongoDB(); 
})