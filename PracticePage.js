// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import CodeMirror from "@uiw/react-codemirror";
// import { java } from "@codemirror/lang-java";
// import {
//   Box,
//   Button,
//   Typography,
//   CircularProgress,
//   Paper,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
//   TextField,
//   Tabs,
//   Tab,
// } from "@mui/material";

// const javaTemplate = `import java.util.*;
// import java.io.*;

// public class Main {
//     public static void main(String[] args) throws IOException {
//         BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
//         String inputLine = br.readLine();
//         System.out.println("You entered: " + inputLine);
//     }
// }
// `;

// const PracticePage = () => {
//   const { problemId } = useParams();
//   const [problem, setProblem] = useState(null);
//   const [myCode, setMyCode] = useState(javaTemplate);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // State for the unified console window
//   const [customInput, setCustomInput] = useState("");
//   const [consoleOutput, setConsoleOutput] = useState(null); // Renamed for clarity
//   const [isLoadingConsole, setIsLoadingConsole] = useState(false);
//   const [activeTab, setActiveTab] = useState(0);

//   useEffect(() => {
//     const fetchProblem = async () => {
//       try {
//         const { data } = await axios.get(`/api/problems/${problemId}`);
//         setProblem(data);
//         if (data.examples && data.examples.length > 0) {
//           const exampleInput = data.examples[0].input
//             .split(",")[0]
//             .split("=")[1];
//           setCustomInput(exampleInput ? exampleInput.trim() : "");
//         }
//       } catch (error) {
//         console.error("Failed to fetch problem", error);
//       }
//     };
//     fetchProblem();
//   }, [problemId]);

//   const handleCodeChange = (newCode) => {
//     setMyCode(newCode);
//   };

//   const handleRun = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("You must be logged in to run code.");
//       return;
//     }
//     setIsLoadingConsole(true);
//     setConsoleOutput(null);
//     setActiveTab(1);
//     try {
//       const config = {
//         headers: { "Content-Type": "application/json", "x-auth-token": token },
//       };
//       const body = { code: myCode, language: "java", customInput };
//       const { data } = await axios.post("/api/run", body, config);
//       // Format the simple run output
//       const formattedOutput = data.stderr ? (
//         <Typography color="error">{data.stderr}</Typography>
//       ) : (
//         <Typography>{data.stdout || "No output."}</Typography>
//       );
//       setConsoleOutput(formattedOutput);
//     } catch (error) {
//       console.error("Run failed", error);
//       setConsoleOutput(
//         <Typography color="error">
//           An error occurred while running your code.
//         </Typography>
//       );
//     } finally {
//       setIsLoadingConsole(false);
//     }
//   };

//   const handleSubmit = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("You must be logged in to submit a solution.");
//       return;
//     }

//     setIsSubmitting(true);
//     setConsoleOutput(null); // Clear the console
//     setActiveTab(1); // Switch to the result tab

//     try {
//       const config = {
//         headers: { "Content-Type": "application/json", "x-auth-token": token },
//       };
//       const body = { code: myCode, language: "java", problemId: problemId };
//       const { data } = await axios.post("/api/submissions", body, config);

//       // --- NEW: Format the submission results into JSX for the console ---
//       const formattedResults = (
//         <Box>
//           <Typography variant="h6" sx={{ mb: 1 }}>
//             Submission Results
//           </Typography>
//           {data.results.map((result, index) => (
//             <Box
//               key={index}
//               sx={{
//                 mt: 1,
//                 p: 1,
//                 borderRadius: "4px",
//                 background:
//                   result.status.description === "Accepted"
//                     ? "rgba(0, 245, 212, 0.1)"
//                     : "rgba(255, 0, 248, 0.1)",
//               }}
//             >
//               <Typography>
//                 <strong>Test Case {index + 1}:</strong>{" "}
//                 {result.status.description}
//               </Typography>
//               {result.stdout && (
//                 <pre
//                   style={{
//                     margin: 0,
//                     whiteSpace: "pre-wrap",
//                     wordBreak: "break-all",
//                   }}
//                 >
//                   Output: {result.stdout.trim()}
//                 </pre>
//               )}
//               {result.stderr && (
//                 <pre
//                   style={{
//                     margin: 0,
//                     whiteSpace: "pre-wrap",
//                     wordBreak: "break-all",
//                     color: "red",
//                   }}
//                 >
//                   Error: {result.stderr.trim()}
//                 </pre>
//               )}
//             </Box>
//           ))}
//         </Box>
//       );
//       setConsoleOutput(formattedResults);
//     } catch (error) {
//       console.error("Submission failed", error);
//       setConsoleOutput(
//         <Typography color="error">
//           An error occurred during submission.
//         </Typography>
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!problem) {
//     return (
//       <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         gap: "2rem",
//         flexDirection: { xs: "column", lg: "row" },
//       }}
//     >
//       {/* Left Panel: Problem Description */}
//       <Box sx={{ flex: 1.5, overflowY: "auto", height: "calc(100vh - 120px)" }}>
//         <Typography variant="h4" gutterBottom>
//           {problem.title}
//         </Typography>
//         <Typography paragraph color="text.secondary">
//           {problem.description}
//         </Typography>
//         <Divider sx={{ my: 2 }} />
//         {problem.examples &&
//           problem.examples.map((example, index) => (
//             <Box key={index} sx={{ mb: 2 }}>
//               <Typography variant="h6">Example {index + 1}:</Typography>
//               <Paper
//                 elevation={0}
//                 sx={{
//                   p: 2,
//                   background: "rgba(255, 255, 255, 0.05)",
//                   fontFamily: "monospace",
//                   whiteSpace: "pre-wrap",
//                 }}
//               >
//                 <strong>Input:</strong> {example.input}
//                 <br />
//                 <strong>Output:</strong> {example.output}
//                 {example.explanation && (
//                   <>
//                     <br />
//                     <strong>Explanation:</strong> {example.explanation}
//                   </>
//                 )}
//               </Paper>
//             </Box>
//           ))}
//         {problem.constraints && problem.constraints.length > 0 && (
//           <Box sx={{ mt: 3 }}>
//             <Typography variant="h6">Constraints:</Typography>
//             <List dense>
//               {problem.constraints.map((c, i) => (
//                 <ListItem key={i} sx={{ pl: 2 }}>
//                   <ListItemText primary={`• ${c}`} />
//                 </ListItem>
//               ))}
//             </List>
//           </Box>
//         )}
//       </Box>

//       {/* Right Panel: Code Editor and Console */}
//       <Box
//         sx={{ flex: 2, display: "flex", flexDirection: "column", gap: "1rem" }}
//       >
//         <Typography variant="h5">Your Code (Java)</Typography>
//         <CodeMirror
//           value={myCode}
//           height="450px"
//           extensions={[java()]}
//           onChange={handleCodeChange}
//           theme="dark"
//         />

//         <Paper elevation={3} sx={{ flexGrow: 1 }}>
//           <Tabs
//             value={activeTab}
//             onChange={(e, newValue) => setActiveTab(newValue)}
//           >
//             <Tab label="Testcase" />
//             <Tab label="Result" />
//           </Tabs>
//           {activeTab === 0 && (
//             <Box p={2}>
//               <TextField
//                 label="Custom Input"
//                 multiline
//                 rows={4}
//                 fullWidth
//                 variant="outlined"
//                 value={customInput}
//                 onChange={(e) => setCustomInput(e.target.value)}
//               />
//             </Box>
//           )}
//           {activeTab === 1 && (
//             <Box
//               p={2}
//               sx={{
//                 fontFamily: "monospace",
//                 whiteSpace: "pre-wrap",
//                 background: "#1e1e1e",
//                 color: "#c9d1d9",
//                 borderRadius: "4px",
//                 minHeight: "130px",
//               }}
//             >
//               {isLoadingConsole || isSubmitting ? (
//                 <CircularProgress size={24} />
//               ) : consoleOutput ? (
//                 consoleOutput
//               ) : (
//                 "Run or submit your code to see the output here."
//               )}
//             </Box>
//           )}
//         </Paper>

//         <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
//           <Button
//             onClick={handleRun}
//             disabled={isLoadingConsole || isSubmitting}
//             variant="outlined"
//           >
//             {isLoadingConsole ? <CircularProgress size={24} /> : "Run"}
//           </Button>
//           <Button
//             onClick={handleSubmit}
//             disabled={isSubmitting || isLoadingConsole}
//             variant="contained"
//             color="primary"
//           >
//             {isSubmitting ? <CircularProgress size={24} /> : "Submit"}
//           </Button>
//         </Box>

//         {/* --- The old submission result area is now removed --- */}
//       </Box>
//     </Box>
//   );
// };

// export default PracticePage;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

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

const PracticePage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [myCode, setMyCode] = useState(javaTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [testCases, setTestCases] = useState([{ id: 1, input: "" }]);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);

  const [consoleOutput, setConsoleOutput] = useState(null);
  const [isLoadingConsole, setIsLoadingConsole] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState(0);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data } = await axios.get(`/api/problems/${problemId}`);
        setProblem(data);

        // --- FIX: Pre-fill editable test cases from the problem's actual testCases array ---
        if (data.testCases && data.testCases.length > 0) {
          const initialTestCases = data.testCases.map((tc, index) => ({
            id: index + 1,
            input: tc.input, // Use the direct, correct input format
          }));
          setTestCases(initialTestCases);
        }
      } catch (error) {
        console.error("Failed to fetch problem", error);
      }
    };
    fetchProblem();
  }, [problemId]);

  const handleCodeChange = (newCode) => {
    setMyCode(newCode);
  };

  const handleTestCaseInputChange = (index, value) => {
    const newTestCases = [...testCases];
    newTestCases[index].input = value;
    setTestCases(newTestCases);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { id: Date.now(), input: "" }]);
    setActiveTestCaseTab(testCases.length);
  };

  const handleRun = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to run code.");

    setIsLoadingConsole(true);
    setConsoleOutput(null);
    setActiveResultTab(1); // Switch to result tab

    try {
      const config = {
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      };
      const inputs = testCases.map((tc) => tc.input);
      const body = { code: myCode, language: "java", inputs: inputs };
      const { data } = await axios.post("/api/run", body, config);
      setConsoleOutput(data);
    } catch (error) {
      console.error("Run failed", error);
      setConsoleOutput([
        { stderr: "An error occurred while running your code." },
      ]);
    } finally {
      setIsLoadingConsole(false);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to submit a solution.");

    setIsSubmitting(true);
    setConsoleOutput(null);
    setActiveResultTab(1); // Switch to result tab

    try {
      const config = {
        headers: { "Content-Type": "application/json", "x-auth-token": token },
      };
      const body = { code: myCode, language: "java", problemId: problemId };
      const { data } = await axios.post("/api/submissions", body, config);
      setConsoleOutput(data.results);
    } catch (error) {
      console.error("Submission failed", error);
      setConsoleOutput([{ stderr: "An error occurred during submission." }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!problem) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: "2rem",
        flexDirection: { xs: "column", lg: "row" },
      }}
    >
      {/* Left Panel */}
      <Box sx={{ flex: 1.5, overflowY: "auto", height: "calc(100vh - 120px)" }}>
        <Typography variant="h4" gutterBottom>
          {problem.title}
        </Typography>
        <Typography paragraph color="text.secondary">
          {problem.description}
        </Typography>
        <Divider sx={{ my: 2 }} />
        {problem.examples?.map((example, index) => (
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
        {problem.constraints?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Constraints:</Typography>
            <List dense>
              {problem.constraints.map((c, i) => (
                <ListItem key={i} sx={{ pl: 2 }}>
                  <ListItemText primary={`• ${c}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Right Panel */}
      <Box
        sx={{ flex: 2, display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <Typography variant="h5">Your Code (Java)</Typography>
        <CodeMirror
          value={myCode}
          height="450px"
          extensions={[java()]}
          onChange={handleCodeChange}
          theme="dark"
        />

        <Paper elevation={3} sx={{ flexGrow: 1 }}>
          <Tabs
            value={activeResultTab}
            onChange={(e, newValue) => setActiveResultTab(newValue)}
          >
            <Tab label="Testcases" />
            <Tab label="Result" />
          </Tabs>
          {activeResultTab === 0 && (
            <Box>
              <Tabs
                value={activeTestCaseTab}
                onChange={(e, val) => setActiveTestCaseTab(val)}
                variant="scrollable"
              >
                {testCases.map((tc, index) => (
                  <Tab key={tc.id} label={`Case ${index + 1}`} />
                ))}
                <IconButton onClick={addTestCase}>
                  <AddIcon />
                </IconButton>
              </Tabs>
              <Box p={2}>
                <TextField
                  label={`Input for Case ${activeTestCaseTab + 1}`}
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  value={testCases[activeTestCaseTab]?.input || ""}
                  onChange={(e) =>
                    handleTestCaseInputChange(activeTestCaseTab, e.target.value)
                  }
                />
              </Box>
            </Box>
          )}
          {activeResultTab === 1 && (
            <Box
              p={2}
              sx={{
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                background: "#1e1e1e",
                color: "#c9d1d9",
                borderRadius: "4px",
                minHeight: "130px",
                overflowY: "auto",
              }}
            >
              {isLoadingConsole || isSubmitting ? (
                <CircularProgress size={24} />
              ) : consoleOutput ? (
                <Box>
                  {consoleOutput.map((result, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 1,
                        borderRadius: "4px",
                        border: "1px solid #444",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            result.status?.description === "Accepted"
                              ? "lightgreen"
                              : "lightcoral",
                        }}
                      >
                        Case {index + 1}:{" "}
                        {result.status?.description ||
                          (result.stderr ? "Error" : "Finished")}
                      </Typography>
                      {result.stdout && (
                        <pre style={{ margin: 0 }}>Output: {result.stdout}</pre>
                      )}
                      {result.stderr && (
                        <pre style={{ margin: 0, color: "lightcoral" }}>
                          Error: {result.stderr}
                        </pre>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                "Run or submit your code to see the output here."
              )}
            </Box>
          )}
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <Button
            onClick={handleRun}
            disabled={isLoadingConsole || isSubmitting}
            variant="outlined"
          >
            {isLoadingConsole ? <CircularProgress size={24} /> : "Run"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingConsole}
            variant="contained"
            color="primary"
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PracticePage;
