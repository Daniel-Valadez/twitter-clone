import User from "../models/user.model.js";

import jwt from "jsonwebtoken"; 

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; 
    if(!token) {
      return res.status(401).json({error: "Unauthorized: no token provided"}); 
    } 
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    if(!decoded) {
      return res.status(401).json({error: "Unauthorized: invalid token"}); 
    }

    //Return the user but DO NOT send us the password. 
    const user = await User.findById(decoded.userId).select("-password"); 

    if(!user) {
      return res.status(404).json({error: "user not found"}); 
    }

    req.user = user; 

    console.log(req.user); 
    next(); 

  } catch (error) {
    res.status(500).json({error: "Internal server error"})
  }
}