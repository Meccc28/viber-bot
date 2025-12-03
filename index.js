import express from "express";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 10000;
const app = express();

app.use(express.json());

// Create bot WITHOUT polling
const bot = new TelegramBot(token, { polling: false });

// Your webhook route
app.post(`/webhook/${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Example bot command
bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "Bot is running with webhooks on Render!");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
