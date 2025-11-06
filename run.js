const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

// @route   POST api/run
// @desc    Run code with multiple custom inputs
// @access  Private
router.post("/", auth, async (req, res) => {
  const { code, language, inputs } = req.body;

  const languageMap = { java: 62, javascript: 93, python: 71 };
  const language_id = languageMap[language];

  if (!language_id) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    // --- FIX: Implement robust two-step polling for batch submissions ---

    // Step 1: Create the batch submission
    const submissions = inputs.map((input) => ({
      source_code: code,
      language_id: language_id,
      stdin: input,
    }));

    const createOptions = {
      method: "POST",
      url: `${JUDGE0_API_URL}/batch`,
      params: { base64_encoded: "false" }, // Remove the invalid 'wait' parameter
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
      data: { submissions: submissions },
    };

    const createResponse = await axios.request(createOptions);
    const tokens = createResponse.data.map((s) => s.token).join(",");

    // Step 2: Poll for the results after a delay
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for execution

    const getOptions = {
      method: "GET",
      url: `${JUDGE0_API_URL}/batch`,
      params: { tokens: tokens, base64_encoded: "false", fields: "*" },
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    };

    const resultResponse = await axios.request(getOptions);

    // Send the array of results back to the client
    res.json(resultResponse.data.submissions);
  } catch (error) {
    console.error(
      "Error with Judge0 Run API:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to run code" });
  }
});

module.exports = router;
