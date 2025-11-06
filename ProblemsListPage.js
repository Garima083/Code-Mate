import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
} from "@mui/material";

const ProblemsListPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await axios.get("/api/problems");
        setProblems(res.data);
      } catch (err) {
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Coding Problems
      </Typography>
      <Grid container spacing={3}>
        {problems.map((problem) => (
          <Grid item xs={12} md={6} lg={4} key={problem._id}>
            <Card sx={{ height: "100%" }}>
              {/* --- CORRECTED LINK to the practice page --- */}
              <CardActionArea
                component={RouterLink}
                to={`/practice/${problem._id}`}
                sx={{ height: "100%" }}
              >
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {problem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Difficulty: {problem.difficulty}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProblemsListPage;
