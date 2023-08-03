const express = require('express');
const dotenv = require('dotenv');
dotenv.config({}); 
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client || ''
});
const googleRouter = require('./routes/google');
const eventRouter = require('./routes/event');
const Event = require('./models/event.model');


// Middlewares
app.use(bodyParser.json());
app.use('/google', googleRouter);
app.use('/event', eventRouter);


// Connect to MongoDB
const mongoDBConnectionString = process.env.CONNECTION_STRING || '';
mongoose.connect(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });


// creating an Auth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

// Sync events from Google Calendar to MongoDB
app.get('/sync', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  });
  events.data.items.forEach(async event => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;
    await Event.findOneAndUpdate(
      { eventId: event.id },
      { eventId: event.id, summary: event.summary, location: event.location, description: event.description, start, end },
      { upsert: true }
    );
  });
  res.json(events.data.items);
});

app.listen(8000, () => console.log('Server listening on port 8000'));
