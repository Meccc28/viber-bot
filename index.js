const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// --- Your Telegram bot code below ---
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('get FO')) {
    const name = text.replace('get FO ', '').trim();
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A:D',
      });

      const row = res.data.values.find(r => r[1] === name);
      if (row) {
        bot.sendMessage(chatId, `${row[1]} | ${row[2]} | ${row[3]}`);
      } else {
        bot.sendMessage(chatId, 'No record found.');
      }
    } catch (err) {
      bot.sendMessage(chatId, 'Error reading spreadsheet.');
      console.error(err);
    }
  }
});
