import TelegramBot from 'node-telegram-bot-api';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// --- Environment variables ---
const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: BOT_TOKEN or TELEGRAM_BOT_TOKEN is not set.');
  process.exit(1);
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error('Error: SPREADSHEET_ID is not set.');
  process.exit(1);
}

const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.');
  process.exit(1);
}

// --- Google Sheets setup ---
const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// --- Telegram bot setup ---
const bot = new TelegramBot(token, { polling: true });

bot.onText(/get FO (.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const nameQuery = match[1].trim().toLowerCase();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FO!B:D',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      bot.sendMessage(chatId, 'No records found.');
      return;
    }

    const result = rows.find(row => row[0].toLowerCase() === nameQuery);

    if (result) {
      bot.sendMessage(chatId, `Record found:\nB: ${result[0]}\nC: ${result[1] || ''}\nD: ${result[2] || ''}`);
    } else {
      bot.sendMessage(chatId, 'No record found.');
    }
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    bot.sendMessage(chatId, 'Error accessing the spreadsheet.');
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.code, err.message);
});

// --- Web server for Render health check ---
import express from 'express';
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Telegram bot is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
