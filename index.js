const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

// Environment variables from Render
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const PORT = process.env.PORT || 10000; // Render sets PORT automatically
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// Initialize bot **without polling**
const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${RENDER_EXTERNAL_URL}/bot${TOKEN}`);

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Telegram webhook endpoint
app.post(`/bot${TOKEN}`, async (req, res) => {
  const update = req.body;

  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.startsWith('get FO')) {
      const name = text.replace('get FO ', '').trim();

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'FO!B:D', // Adjust tab name and columns
        });

        const row = response.data.values.find(r => r[0] === name);
        if (row) {
          await bot.sendMessage(chatId, `${row[0]} | ${row[1]} | ${row[2]}`);
        } else {
          await bot.sendMessage(chatId, 'No record found.');
        }
      } catch (err) {
        console.error('Error reading spreadsheet:', err);
        await bot.sendMessage(chatId, 'Error reading spreadsheet.');
      }
    }
  }

  res.sendStatus(200); // Respond to Telegram
});

// Optional root endpoint
app.get('/', (req, res) => {
  res.send('Telegram bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
