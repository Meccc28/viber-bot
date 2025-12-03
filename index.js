const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

// Telegram bot setup
// Use the environment variable name, NOT the actual token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  // Parse the JSON string from the environment variable
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Command listener
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith('get FO')) {
    const name = text.replace('get FO ', '').trim();
    try {
      const res = await sheets.spreadsheets.values.get({
        // Use environment variable for spreadsheet ID
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A:C', // adjust based on your sheet
      });

      const row = res.data.values.find(r => r[0] === name);
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
});
