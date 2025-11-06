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
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../App";
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

const BattlePage = () => {
  const { roomId, problemId } = useParams();
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [matchState, setMatchState] = useState("in_progress");
  const [winner, setWinner] = useState(null);
  const [timer, setTimer] = useState(300);
  const [problem, setProblem] = useState(null);
  const [myCode, setMyCode] = useState(javaTemplate);
  const [opponentCode, setOpponentCode] = useState(
    "// Waiting for opponent..."
  );
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentary, setCommentary] = useState([]);

  useEffect(() => {
    if (matchState === "in_progress" && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && matchState === "in_progress") {
      setMatchState("finished");
      setWinner("Time Up!");
    }
  }, [timer, matchState]);

  useEffect(() => {
    axios
      .get(`/api/problems/${problemId}`)
      .then((res) => setProblem(res.data))
      .catch((err) => console.error("Failed to fetch problem", err));
  }, [problemId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("joinBattleRoom", roomId);

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
    socket.on("matchEnd", ({ winner }) => {
      setMatchState("finished");
      setWinner(winner);
    });

    return () => {
      socket.off("opponentCodeChange");
      socket.off("newCommentary");
      socket.off("testCaseResult");
      socket.off("matchEnd");
    };
  }, [socket, roomId]);

  const handleCodeChange = (newCode) => {
    setMyCode(newCode);
    if (socket) {
      socket.emit("codeChange", { roomId, newCode });
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in.");

    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const config = {
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      };
      const body = { code: myCode, language: "java", problemId, roomId };
      const { data } = await axios.post("/api/submissions", body, config);
      setSubmissionResult(data.results);

      if (data.allPassed) {
        if (user) {
          socket.emit("iWon", {
            roomId,
            user: { id: user._id, username: user.username },
          });
        }
      }
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
            {winner === user?.username ? (
              <>
                <EmojiEventsIcon sx={{ fontSize: 80, color: "gold" }} />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  You Win!
                </Typography>
              </>
            ) : (
              <>
                <SentimentVeryDissatisfiedIcon
                  sx={{ fontSize: 80, color: "grey.500" }}
                />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  You Lose
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Winner: {winner}
                </Typography>
              </>
            )}
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
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        {/* Left Panel */}
        <Box sx={{ flex: 1.5 }}>
          <Typography variant="h4" gutterBottom>
            {problem.title}
          </Typography>
          <Paper
            elevation={3}
            sx={{ p: 2, mb: 2, textAlign: "center", background: "transparent" }}
          >
            <Typography variant="h4" color="primary">
              {formatTime(timer)}
            </Typography>
          </Paper>
          <Typography paragraph color="text.secondary">
            {problem.description}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* --- NEW: Examples Section --- */}
          {problem.examples &&
            problem.examples.map((example, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="h6">Example {index + 1}:</Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <strong>Input:</strong> {example.input}
                  <br />
                  <strong>Output:</strong> {example.output}
                  {example.explanation && (
                    <>
                      <br />
                      <strong>Explanation:</strong> {example.explanation}
                    </>
                  )}
                </Paper>
              </Box>
            ))}

          {/* --- NEW: Constraints Section --- */}
          {problem.constraints && problem.constraints.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Constraints:</Typography>
              <List dense>
                {problem.constraints.map((constraint, index) => (
                  <ListItem key={index} sx={{ pl: 2 }}>
                    <ListItemText primary={`• ${constraint}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

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
          {submissionResult && (
            <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
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
                        margin: 0,
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
                        margin: 0,
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
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BattlePage;
