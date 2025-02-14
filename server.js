const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const connectDB = require("./config/dbConnection.js");
connectDB();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT;

app.use("/questions", require("./routes/questionRoutes.js"));
app.use("/execute", require("./routes/codeRoutes.js"));

app.listen(port, () => console.log(`Server running on port ${port}`));
