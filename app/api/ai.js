const express = require("express");
const aiService = require("../services/aiService");
const authMiddleware = require("../core/authMiddleware");
const router = express.Router();

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const response = await aiService.getChatResponse(message);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/summarize", authMiddleware, async (req, res) => {
    try {
        const { messages } = req.body; // Array of message objects
        const summary = await aiService.summarizeChat(messages);
        res.json({ summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
