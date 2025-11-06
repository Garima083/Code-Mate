import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import GroupIcon from "@mui/icons-material/Group";

const LobbyPage = () => {
  const [rooms, setRooms] = useState({});
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axios.get("/api/problems");
        setProblems(data);
      } catch (error) {
        console.error("Failed to fetch problems for lobby:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblems();

    if (!socket) return;

    socket.emit("getLobbyState");
    socket.on("lobbyUpdate", (updatedRooms) => {
      setRooms(updatedRooms);
    });

    // --- THIS IS THE CORRECTED NAVIGATION LOGIC ---
    socket.on("matchStart", ({ roomId, problemId }) => {
      // Navigate to the new /battle URL structure
      navigate(`/battle/${roomId}/${problemId}`);
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("matchStart");
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!socket) {
      alert("Connection not ready, please wait a moment.");
      return;
    }
    if (problems.length === 0) {
      alert("No problems available to create a match.");
      return;
    }

    const problemToUse = problems[0];
    const user = {
      id: `user_${Date.now()}`,
      username: "Player" + Math.floor(Math.random() * 100),
    };

    socket.emit("createRoom", {
      problemId: problemToUse._id,
      problemTitle: problemToUse.title,
      user: user,
    });
  };

  const handleJoinRoom = (roomId) => {
    if (!socket) return;
    const user = {
      id: `user_${Date.now()}`,
      username: "Player" + Math.floor(Math.random() * 100),
    };
    socket.emit("joinRoom", { roomId, user });
  };

  return (
    <Box>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        align="center"
        sx={{ fontWeight: "bold" }}
      >
        Game Lobby
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddCircleOutlineIcon />}
        onClick={handleCreateRoom}
        sx={{ mb: 4 }}
        disabled={isLoading || problems.length === 0}
      >
        Create New Match
      </Button>

      <Paper
        elevation={3}
        sx={{ p: 2, background: "transparent", backdropFilter: "blur(5px)" }}
      >
        <Typography variant="h5" gutterBottom>
          Available Rooms
        </Typography>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {Object.values(rooms).length > 0 ? (
              Object.values(rooms).map((room) => (
                <React.Fragment key={room.id}>
                  <ListItem
                    secondaryAction={
                      <Button
                        variant="outlined"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={
                          room.status === "in_progress" ||
                          room.status === "finished"
                        }
                      >
                        {room.status === "waiting" ? "Join" : "In Progress"}
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <GroupIcon
                        color={
                          room.status === "in_progress" ? "error" : "success"
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={room.problemTitle}
                      secondary={`Players: ${room.players
                        .map((p) => p.username)
                        .join(", ")} (${room.players.length}/2)`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <Typography sx={{ p: 2 }} color="text.secondary">
                No available rooms. Why not create one?
              </Typography>
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default LobbyPage;
