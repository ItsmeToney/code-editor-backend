const Question = require("../models/questionModel.js");

//get all questions
//GET
const getAllQuestions = async (req, res) => {
  try {
    const data = await Question.find();
    res.status(200).json({
      message: "Questions fetched successfully",
      results: data.length,
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Cant fetch questions" });
  }
};

//get a question by id
// GET

const getQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;

    const question = await Question.findById({ _id: questionId });
    if (!question) {
      res.status(404).json({ message: "Cannot find question" });
    }

    res
      .status(200)
      .json({ message: "Question loaded successfully", data: question });
  } catch (err) {
    res.status(500).json({ message: "Unable to load question." });
  }
};

//create a question
//POST
const createQuestion = async (req, res) => {
  try {
    const { title, description, testCases, functionSignatures } = req.body;
    if (!title || !description || !testCases || !functionSignatures) {
      res.status(400).json({ message: "All fields are mandatory" });
    }
    const newQuestion = new Question({
      title,
      description,
      testCases,
      functionSignatures,
    });
    const savedQuestion = await newQuestion.save();
    res.status(200).json({
      message: "Question saved successfully",
      data: savedQuestion,
    });
  } catch (err) {
    console.log("Failed to save question", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//delete a question
//DELETE
const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById({ _id: questionId });
    if (!question) {
      res.status(404).json({ message: "Question didn't exist" });
    }

    await Question.deleteOne({ _id: questionId });
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting the question" });
  }
};

module.exports = {
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  getQuestion,
};
