const express = require("express");
const Question = require("../models/questionModel.js");
const router = express.Router();
const {
  getAllQuestions,
  getQuestion,
  createQuestion,
  deleteQuestion,
} = require("../controller/questionController.js");

router.route("/").get(getAllQuestions).post(createQuestion);
// router.route("/:id").get(getQuestion).delete(deleteQuestion).put(updateQuestion);
router.route("/:id").get(getQuestion).delete(deleteQuestion);

router.get("/:id/:language", async (req, res) => {
  const { id, language } = req.params;

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ error: "Question not found" });

    res.json({
      title: question.title,
      description: question.description,
      functionSignature: question.functionSignatures[language],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
