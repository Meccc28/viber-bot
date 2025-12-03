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

  try {
    const client = await auth.getClient();
    const res = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = res.data.values || [];
    const dataRows = rows.slice(1); // skip header

    // Handle "get <name>"
    if (/^get\s+/i.test(text)) {
      const query = text.replace(/^get\s+/i, '').trim();
      const results = dataRows.filter(row => row[0]?.trim().toLowerCase() === query.toLowerCase());

      if (results.length === 0) {
        bot.sendMessage(chatId, 'No record found.');
      } else {
        results.forEach(row => {
          const [name, area, number] = row;
          bot.sendMessage(chatId, `${name} | ${area} | ${number}`);
        });
      }
    }

    // Handle "list FO"
    else if (/^list\s+FO$/i.test(text)) {
      const foList = dataRows.map(row => row[0]).filter(Boolean); // column B
      if (foList.length === 0) {
        bot.sendMessage(chatId, 'No FO records found.');
      } else {
        // Send in chunks if list is long
        const chunkSize = 30;
        for (let i = 0; i < foList.length; i += chunkSize) {
          const chunk = foList.slice(i, i + chunkSize).join('\n');
          bot.sendMessage(chatId, chunk);
        }
      }
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Error accessing the spreadsheet.');
  }
});

// Optional: dummy web server for Render
import express from 'express';
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Telegram bot is running.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
