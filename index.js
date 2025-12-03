const express = require("express");
const bodyParser = require("body-parser");
const { Bot, Events, Message } = require("viber-bot");
const { google } = require("googleapis");

// GOOGLE SHEETS SETUP
const auth = new google.auth.GoogleAuth({
    keyFile: "service_account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

const SPREADSHEET_ID = "PUT_YOUR_SPREADSHEET_ID_HERE";
const RANGE = "Sheet1!A:C";

async function searchGoogleSheet(name) {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE
    });

    const rows = res.data.values || [];
    return rows.find(row => row[0].toLowerCase() === name.toLowerCase()) || null;
}

// VIBER BOT SETUP
const bot = new Bot({
    authToken: "PUT_YOUR_VIBER_BOT_TOKEN_HERE",
    name: "InfoBot",
    avatar: ""
});

// HANDLE USER MESSAGES
bot.on(Events.MESSAGE_RECEIVED, async (message, response) => {
    const text = message.text;

    if (text.toLowerCase().startsWith("get ")) {
        const name = text.slice(4).trim();

        const result = await searchGoogleSheet(name);
        if (!result) {
            response.send(new Message.Text("No record found."));
        } else {
            response.send(new Message.Text(
                `${result[0]} | ${result[1]} | ${result[2]}`
            ));
        }
        return;
    }

    response.send(new Message.Text("Try: get FO Bartolome Ibanez"));
});

// EXPRESS SERVER
const app = express();
app.use(bodyParser.json());
app.use("/viber/webhook", bot.middleware());

app.listen(3000, () => {
    console.log("Bot is running on port 3000");
});
