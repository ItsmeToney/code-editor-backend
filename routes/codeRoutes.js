const express = require("express");
const { codeExecution } = require("../controller/codeController");

const router = express.Router();

router.route("").post(codeExecution);

module.exports = router;
