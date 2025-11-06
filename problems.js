const express = require("express");
const router = express.Router();
const Problem = require("../models/Problem");

// @route   GET api/problems
// @desc    Get all problems
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Select '-testCases' to avoid sending the answers to the main list
    const problems = await Problem.find().select("-testCases");
    res.json(problems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/problems/:id
// @desc    Get a single problem by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    // If no problem is found with that ID, return a 404 error
    if (!problem) {
      return res.status(404).json({ msg: "Problem not found" });
    }

    // If the problem is found, return it as JSON
    res.json(problem);
  } catch (err) {
    console.error(err.message);
    // This handles cases where the ID is not a valid MongoDB ObjectId format
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Problem not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST api/problems
// @desc    Create a new problem (for admin use)
// @access  Private (should be protected in a real app)
router.post("/", async (req, res) => {
  const { title, description, difficulty, testCases } = req.body;
  try {
    const newProblem = new Problem({
      title,
      description,
      difficulty,
      testCases,
    });
    const problem = await newProblem.save();
    res.json(problem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
