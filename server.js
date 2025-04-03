const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const connectDB = require("./config/dbConnection.js");
connectDB();

app.use(express.json());
app.use(bodyParser.json()); // Ensure body parsing

app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend origin
    methods: ["GET", "POST", "OPTIONS"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
    credentials: true, // Allow cookies if needed
    optionsSuccessStatus: 200, // Some browsers need this for legacy support
  })
);

// Handle preflight requests explicitly
app.options("*", (req, res) => {
  res.sendStatus(204); // No Content (Success)
});

app.use(bodyParser.json());

const port = process.env.PORT;

app.use("/questions", require("./routes/questionRoutes.js"));
app.use("/execute", require("./routes/codeRoutes.js"));

app.listen(port, () => console.log(`Server running on port ${port}`));
