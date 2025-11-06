// server/models/Match.js
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  problem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Problem', 
    required: true 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  codeSubmitted: { 
    type: String, 
    required: true 
  },
  playedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Match', MatchSchema);