import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Fade,
} from "@mui/material";
import { SocketContext } from "../context/SocketContext";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";

const javaTemplate = `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String inputLine = br.readLine();
        System.out.println("You entered: " + inputLine);
    }
}
`;

const ProblemPage = () => {
  const { id: problemId } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  // --- NEW STATE FOR MATCH LOGIC ---
  const [matchState, setMatchState] = useState("in_progress"); // 'in_progress', 'finished'
  const [winner, setWinner] = useState(null);
  const [timer, setTimer] = useState(300); // 5-minute timer (300 seconds)

  // Existing state
  const [problem, setProblem] = useState(null);
  const [myCode, setMyCode] = useState(javaTemplate);
  const [opponentCode, setOpponentCode] = useState(
    "// Waiting for opponent..."
  );
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentary, setCommentary] = useState([]);

  // --- NEW: useEffect for the match timer ---
  useEffect(() => {
    if (matchState === "in_progress" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && matchState === "in_progress") {
      // Handle timeout if needed
      setMatchState("finished");
      setWinner("Time Up!"); // Or handle draws
    }
  }, [timer, matchState]);

  // useEffect for fetching problem data
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data } = await axios.get(`/api/problems/${problemId}`);
        setProblem(data);
      } catch (error) {
        console.error("Failed to fetch problem", error);
      }
    };
    fetchProblem();
  }, [problemId]);

  // useEffect for all WebSocket event handling
  useEffect(() => {
    if (!socket) return;
    socket.emit("joinBattleRoom", problemId);

    socket.on("opponentCodeChange", (newCode) => setOpponentCode(newCode));
    socket.on("newCommentary", (data) =>
      setCommentary((prev) => [`🤖 ${data.text}`, ...prev.slice(0, 4)])
    );
    socket.on("testCaseResult", (data) =>
      setCommentary((prev) => [
        `⚡ ${data.username} ${data.status} Test Case #${data.testCaseNumber}!`,
        ...prev.slice(0, 4),
      ])
    );

    // --- NEW: Listener for when the match ends ---
    socket.on("matchEnd", ({ winner, reason }) => {
      setMatchState("finished");
      setWinner(winner);
    });

    return () => {
      socket.off("opponentCodeChange");
      socket.off("newCommentary");
      socket.off("testCaseResult");
      socket.off("matchEnd"); // <-- Cleanup the new listener
    };
  }, [socket, problemId]);

  const handleCodeChange = (newCode) => {
    setMyCode(newCode);
    if (socket) {
      socket.emit("codeChange", { roomId: problemId, newCode });
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to submit a solution.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const config = {
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      };
      // const body = { code: myCode, language: "java", problemId: problemId };
      const body = {
        code: myCode,
        language: "java",
        problemId: problemId,
        roomId: problemId, // Pass the roomId (which is the problemId in our case)
      };
      const { data } = await axios.post("/api/submissions", body, config);
      setSubmissionResult(data);
    } catch (error) {
      console.error("Submission failed", error);
      alert("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!problem) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {/* --- NEW: Match End Overlay --- */}
      {matchState === "finished" && (
        <Fade in={true} timeout={500}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
              textAlign: "center",
              color: "white",
            }}
          >
            <Typography variant="h2" gutterBottom>
              Match Over
            </Typography>
            <EmojiEventsIcon sx={{ fontSize: 80, color: "gold" }} />
            <Typography variant="h4" sx={{ mt: 2 }}>
              Winner: {winner}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 4 }}
              onClick={() => navigate("/lobby")}
            >
              Back to Lobby
            </Button>
          </Box>
        </Fade>
      )}

      <Box
        sx={{
          display: "flex",
          gap: "2rem",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Left Panel */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            {problem.title}
          </Typography>
          {/* --- NEW: Timer Display --- */}
          <Paper
            elevation={3}
            sx={{ p: 2, mb: 2, textAlign: "center", background: "transparent" }}
          >
            <Typography variant="h4" color="primary">
              {formatTime(timer)}
            </Typography>
          </Paper>
          <Typography paragraph>{problem.description}</Typography>
          <Typography variant="h6">Difficulty: {problem.difficulty}</Typography>
          <Box
            sx={{
              mt: 4,
              border: "1px solid",
              borderColor: "divider",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <Typography variant="h6" color="primary">
              🎤 Live Commentary
            </Typography>
            {commentary.map((text, index) => (
              <Typography key={index} sx={{ mt: 1, opacity: 1 - index * 0.2 }}>
                {text}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Right Panel */}
        <Box
          sx={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Typography variant="h5">My Code (Java)</Typography>
          <CodeMirror
            value={myCode}
            height="400px"
            extensions={[java()]}
            onChange={handleCodeChange}
            theme="dark"
            readOnly={matchState === "finished"}
          />
          <Typography variant="h5">Opponent's Code</Typography>
          <CodeMirror
            value={opponentCode}
            height="200px"
            extensions={[java()]}
            readOnly={true}
            theme="dark"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || matchState === "finished"}
            variant="contained"
            color="primary"
            size="large"
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Submit Code"}
          </Button>
          {/* --- FIX: Replaced the placeholder comment with the actual JSX --- */}
          {submissionResult && (
            <Box
              sx={{
                mt: 2,
                border: "1px solid",
                borderColor: "divider",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <Typography variant="h6">Submission Results</Typography>
              {submissionResult.map((result, index) => (
                <Box
                  key={index}
                  sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: "4px",
                    background:
                      result.status.description === "Accepted"
                        ? "rgba(0, 245, 212, 0.1)"
                        : "rgba(255, 0, 248, 0.1)",
                  }}
                >
                  <Typography>
                    <strong>Test Case {index + 1}:</strong>{" "}
                    {result.status.description}
                  </Typography>
                  {result.stdout && (
                    <pre
                      style={{
                        margin: "0.5rem 0 0 0",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      Output: {result.stdout.trim()}
                    </pre>
                  )}
                  {result.stderr && (
                    <pre
                      style={{
                        margin: "0.5rem 0 0 0",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        color: "red",
                      }}
                    >
                      Error: {result.stderr.trim()}
                    </pre>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProblemPage;
