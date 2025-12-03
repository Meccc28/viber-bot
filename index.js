const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const url = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT || 10000;

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Telegram webhook endpoint
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('get FO')) {
    const name = text.replace('get FO ', '').trim();
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'FO!B:D', // Adjust for your sheet
      });

      const row = response.data.values.find(r => r[0] === name);
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

// Set webhook
bot.setWebHook(`${url}/bot${process.env.TELEGRAM_BOT_TOKEN}`);

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
