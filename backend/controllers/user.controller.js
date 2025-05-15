import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");

		if (!user) {
			res.status(400).json({ message: "User not found" });
		} else {
			res.status(200).json(user);
		}
	} catch (error) {
		console.log("INTERNAL SERVER ERROR", error);
		res.status(500).json({ error: error });
	}
};

export const toggleFollowUser = async (req, res) => {
	try {
		const { id } = req.params;

		//We have to modify two users, the user being followed/unfollowed and the logged in user.
		const userToModify = await User.findById(id);

		//This denotes the logged in user.
		const currentUser = await User.findById(req.user._id);

		//Don't allow a logged in user to follow themselves...
		//Ideally, the follow button will be hidden on a user's own profile on the front end.
		if (id === req.user._id.toString()) {
			return res
				.status(400)
				.json({ error: "You can't toggle the follow status for yourself." });
		}

		if (!userToModify || !currentUser) {
			return res.status(400).json({ error: "User(s) not found." });
		}

		const isFollowing = userToModify.followers.includes(currentUser._id);

		//Unfollow the user if already following.
		if (!isFollowing) {
			//First, add the logged in user to the followers list of another user.
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });

			//Then add the other user to the logged in users following array.
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

			//res.status(200).json({message: "User followed successfully"});

			//This will give the user being followed a notification that they have been followed by
			//someone else.
			const newNotification = new Notification({
				type: "follow",
				from: req.user._id,
				to: userToModify._id,
			});

			await newNotification.save();

			res.status(200).json({ message: "User followed successfully" });
		} else {
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully" });
		}
	} catch (error) {
		console.log("INTERNAL SERVER ERROR", error);
		res.status(500).json({ error: error });
	}
};

export const updateUserProfile = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } =
		req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (
			(!newPassword && currentPassword) ||
			(!currentPassword && newPassword)
		) {
			return res
				.status(400)
				.json({
					error: "Please provide both current password and new password",
				});
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch)
				return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res
					.status(400)
					.json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(
					user.profileImg.split("/").pop().split(".")[0]
				);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(
					user.coverImg.split("/").pop().split(".")[0]
				);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;
		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},

			{ $sample: { size: 10 } },
		]);

		const filteredUsers = users.filter(
			(user) => !usersFollowedByMe.following.includes(user._id)
		);

		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("INTERNAL SERVER ERROR", error);
		res.status(500).json({ error: error });
	}
};
