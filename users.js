// server/routes/users.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Match = require("../models/Match");
router.get("/profile", auth, async (req, res) => {
  try {
    const userProfile = await User.findById(req.user.id)
      .select("-password")
      .populate("solvedProblems", ["title", "difficulty"]); // Get title and difficulty for each solved problem

    if (!userProfile) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 2. Fetch the user's match history and populate the problem details.
    const matchHistory = await Match.find({ winner: req.user.id })
      .sort({ playedAt: -1 }) // Show most recent matches first
      .populate("problem", ["title"]); // Get the title of the problem for each match

    // 3. Combine all data into a single response object.
    const fullProfile = {
      user: userProfile,
      history: matchHistory,
    };

    res.json(fullProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
