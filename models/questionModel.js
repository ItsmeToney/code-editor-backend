const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  testCases: [
    {
      input: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      output: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
  ],
  functionSignatures: {
    C: String,
    Java: String,
    Python: String,
  },
});

module.exports = mongoose.model("Question", questionSchema);
