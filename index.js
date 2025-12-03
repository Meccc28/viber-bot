const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

// Express setup
const app = express();
app.use(bodyParser.json());

// Telegram bot setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const url = process.env.RENDER_EXTERNAL_URL; // Render auto-provides this
bot.setWebHook(`${url}/bot`);

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Webhook route
app.post('/bot', async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.startsWith('get FO')) {
    const name = text.replace('get FO ', '').trim();
    try {
      const resSheets = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'FO!B:D', // columns B-D in FO tab
      });

      const row = resSheets.data.values.find(r => r[0] === name);
      if (row) {
        bot.sendMessage(chatId, `${row[0]} | ${row[1]} | ${row[2]}`);
      } else {
        bot.sendMessage(chatId, 'No record found.');
      }
    } catch (err) {
      bot.sendMessage(chatId, 'Error reading spreadsheet.');
      console.error(err);
    }
  }

  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
