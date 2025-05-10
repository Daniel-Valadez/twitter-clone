//import express from "express";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body; 

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ error: "Email has already been used." });
    }

    //Let's hash the user's password now

    if(password.length < 6) {
      return res.status(400).json({error: "Password is too short - must be 6 characters long."}); 
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      username,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        following: newUser.following,
        followers: newUser.followers,
        coverImg: newUser.coverImg,
      });
    } else {
      res.status(400).json({ error: "Invalid user data." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

export const login = async (req, res, next) => {
  try {
    const {username, password} = req.body; 
    const user = await User.findOne({username}); 

    console.log("THIS IS THE USER", user); 

    const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); 
    
    if(!isPasswordCorrect || !user) {
      res.status(400).json({error: "Invalid username or password"}); 
    }

    generateTokenAndSetCookie(user._id, res); 

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      following: user.following,
      followers: user.followers,
      coverImg: user.coverImg,
    })

  } catch(error) {
    console.log("Error logging in", error); 
    res.status(500).json({error: "Internal server error."})
  }
};

export const logout = async (req, res, next) => {
  try {

  } catch(error) {
    console.log("Error logging out", error); 
    res.status(500).json({error: "Internal server error."})
  }
};
