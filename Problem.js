const mongoose = require("mongoose");

const ExampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }, // Optional explanation for the example
});

const ProblemSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  // --- NEW: Structured examples ---
  examples: [ExampleSchema],

  // --- NEW: Constraints for the problem ---
  constraints: [{ type: String }],

  // --- NEW: Tags for categorization ---
  tags: [{ type: String }],

  // Hidden test cases for judging the solution
  testCases: [
    {
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("Problem", ProblemSchema);
