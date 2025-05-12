import express from "express"; 
import { protectRoute } from "../middleware/protectRoute.js";
import { 
  getUserProfile,
  toggleFollowUser, 
  updateUserProfile, 
  getSuggestedUsers, 
} from "../controllers/user.controller.js"; 

const router = express.Router(); 

router.get("/profile/:username", protectRoute, getUserProfile); 
router.get("/suggested", protectRoute, getSuggestedUsers); 
router.post("/follow/:id", protectRoute, toggleFollowUser);
router.post("/update", protectRoute, updateUserProfile); 

export default router; 