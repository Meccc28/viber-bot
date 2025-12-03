import { google } from 'googleapis';
import TelegramBot from 'node-telegram-bot-api';

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Google Sheets setup
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  }),
});

bot.onText(/get (.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const searchValue = match[1].trim(); // e.g., A1, A2

  try {
    // Fetch the entire sheet
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `FO!B:D`, // columns B, C, D
    });

    const rows = res.data.values || [];

    // Filter all rows where column C matches the searchValue
    const matchedRows = rows.filter(r => r[1]?.trim() === searchValue);

    if (matchedRows.length > 0) {
      // Build response string
      const response = matchedRows.map(r => `B: ${r[0]} | C: ${r[1]} | D: ${r[2]}`).join('\n');
      bot.sendMessage(chatId, response);
    } else {
      bot.sendMessage(chatId, 'No record found.');
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Error fetching data.');
  }
});

console.log('Telegram bot running...');
