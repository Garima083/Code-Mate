// client/src/pages/LeaderboardPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axios.get('/api/leaderboard');
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getTrophyColor = (rank) => {
    if (rank === 0) return 'gold';
    if (rank === 1) return 'silver';
    if (rank === 2) return '#cd7f32'; // Bronze
    return 'inherit';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        Top Players
      </Typography>
      <TableContainer component={Paper} sx={{ background: 'transparent', backdropFilter: 'blur(5px)' }}>
        <Table aria-label="leaderboard table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Points</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Wins</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((user, index) => (
              <TableRow key={user._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {index < 3 ? <EmojiEventsIcon sx={{ color: getTrophyColor(index), mr: 1 }} /> : `${index + 1}`}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{user.username.charAt(0).toUpperCase()}</Avatar>
                    <Typography>{user.username}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '1.1rem' }}>{user.stats.points}</TableCell>
                <TableCell align="right" sx={{ fontSize: '1.1rem' }}>{user.stats.wins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LeaderboardPage;