const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const Problem = require("../models/Problem");
const User = require("../models/User");
const Match = require("../models/Match");
const { publisherClient } = require("../config/redis");

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

router.post("/", auth, async (req, res) => {
  const { code, language, problemId, roomId } = req.body;
  const userId = req.user.id;

  const languageMap = { java: 62, javascript: 93, python: 71 };
  const language_id = languageMap[language];

  if (!language_id) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const problem = await Problem.findById(problemId);
    const user = await User.findById(userId);
    if (!problem || !user) {
      return res.status(404).json({ error: "Problem or User not found" });
    }

    // --- Judge0 Execution Logic (No changes here) ---
    const submissions = problem.testCases.map((testCase) => ({
      source_code: code,
      language_id,
      stdin: testCase.input,
      expected_output: testCase.expectedOutput,
    }));
    const options = {
      method: "POST",
      url: `${JUDGE0_API_URL}/batch`,
      params: { base64_encoded: "false", fields: "*" },
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
      data: { submissions },
    };
    const judge0Response = await axios.request(options);
    const tokens = judge0Response.data.map((s) => s.token).join(",");
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const resultOptions = {
      method: "GET",
      url: `${JUDGE0_API_URL}/batch`,
      params: { tokens, base64_encoded: "false", fields: "*" },
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    };
    const resultResponse = await axios.request(resultOptions);
    const results = resultResponse.data.submissions;

    const allPassed = results.every((r) => r.status.description === "Accepted");

    // --- SIMPLIFIED LOGIC ---
    if (allPassed) {
      // If the user won, update their stats and match history in the database.
      const alreadySolved = user.solvedProblems.includes(problemId);
      if (!alreadySolved) {
        const pointsGained =
          problem.difficulty === "Hard"
            ? 20
            : problem.difficulty === "Medium"
            ? 10
            : 5;
        user.stats.wins += 1;
        user.stats.points += pointsGained;
        user.solvedProblems.push(problemId);
        await user.save();
        const newMatch = new Match({
          problem: problemId,
          winner: userId,
          codeSubmitted: code,
        });
        await newMatch.save();
      }
    }

    // --- AI Commentary Logic (No changes here) ---
    const passedCount = results.filter(
      (r) => r.status.description === "Accepted"
    ).length;
    const commentaryEvent = {
      type: "SUBMISSION_EVALUATED",
      payload: {
        problemTitle: problem.title,
        passedCount,
        totalCount: results.length,
        isSuccess: allPassed,
        roomId: roomId,
      },
    };
    await publisherClient.lPush(
      "commentary_queue",
      JSON.stringify(commentaryEvent)
    );

    // --- IMPORTANT: Return the results AND the allPassed flag ---
    res.json({ results, allPassed });
  } catch (error) {
    console.error(
      "Error in Submission Route:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to execute code" });
  }
});

module.exports = router;
