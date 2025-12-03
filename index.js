// ----- Express server for Render free plan -----
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));

app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ----- Telegram bot setup -----
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

// Polling with restart to fix 409 conflict
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: { restart: true } 
});

// ----- Google Sheets setup -----
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ----- Command listener -----
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.startsWith('get FO')) {
    const name = text.replace('get FO ', '').trim();
    try {
      const res = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.SPREADSHEET_ID,
  range: 'Form Responses 1!A:D', // <- use the actual tab name
});

      // FO Name is column B (index 1)
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
