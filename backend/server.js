import express from "express"; 
import dotenv from "dotenv"; 

import authRoutes from "./routes/auth.routes.js"; 
import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config(); 

const app = express(); 

const PORT = process.env.PORT || 5000; 

app.use(express.json()); //middleware to parse the request body. 

app.use("/api/auth", authRoutes); 

app.listen(PORT, (req, res) => {
  console.group("app is listening on", PORT); 
  connectMongoDB(); 
})