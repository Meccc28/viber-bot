import TelegramBot from 'node-telegram-bot-api';
import { google } from 'googleapis';

// Telegram bot token
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = new TelegramBot(botToken, { polling: true });

// Google Sheets setup
const sheets = google.sheets('v4');
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_RANGE = 'FO!B:D'; // Update tab name if needed

// Handle messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  // Check if message starts with "get "
  if (/^get\s+/i.test(text)) {
    const query = text.replace(/^get\s+/i, '').trim();

    try {
      const client = await auth.getClient();
      const res = await sheets.spreadsheets.values.get({
        auth: client,
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_RANGE,
      });

      const rows = res.data.values || [];
      // Filter out header row and match case-insensitive
      const results = rows.slice(1).filter(row => row[0]?.trim().toLowerCase() === query.toLowerCase());

      if (results.length === 0) {
        bot.sendMessage(chatId, 'No record found.');
      } else {
        results.forEach(row => {
          const [name, area, number] = row;
          bot.sendMessage(chatId, `${name} | ${area} | ${number}`);
        });
      }
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, 'Error accessing the spreadsheet.');
    }
  }
});

// Optional: Keep a dummy web server running on Render
import express from 'express';
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Telegram bot is running.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
