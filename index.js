import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { google } from "googleapis";

const app = express();
const PORT = process.env.PORT || 10000;

// --- Telegram Bot (Polling mode) ---
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// --- Google Sheets Auth ---
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

// --- Basic Home Route ---
app.get("/", (req, res) => {
  res.send("Telegram BOT is running");
});

// --- Google Sheets Lookup ---
async function getFO(name) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "FO!B:D", // B = Name, C = Area, D = Number
    });

    const rows = res.data.values;
    if (!rows) return null;

    const match = rows.find((r) => r[0]?.trim().toLowerCase() === name.toLowerCase());
    return match || null;
  } catch (err) {
    console.error("Google Sheets READ ERROR:", err);
    return null;
  }
}

// --- Telegram Bot Command ---
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (text.startsWith("get FO ")) {
    const name = text.replace("get FO ", "").trim();

    const record = await getFO(name);

    if (!record) {
      bot.sendMessage(chatId, "No record found.");
      return;
    }

    const [foName, area, number] = record;

    bot.sendMessage(
      chatId,
      `FOUND RECORD:\nName: ${foName}\nArea: ${area}\nNumber: ${number}`
    );
  }
});

// --- Web Server Required by Render ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
