const express = require('express');
const dotenv = require('dotenv');
dotenv.config({}); 
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const calendar = google.calendar({
  version: 'v3',
  auth: process.env.API_KEY || ''
});
const axios = require('axios');
const dayjs = require('dayjs');
const { v4 : uuid }  = require('uuid');

app.use(bodyParser.json());

// Connect to MongoDB
const mongoDBConnectionString = process.env.CONNECTION_STRING || '';
mongoose.connect(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the Event schema
const eventSchema = new mongoose.Schema({
  eventId: String,
  summary: String,
  location: String,
  description: String,
  start: Date,
  end: Date
});

// Create the Event model
const Event = mongoose.model('Event', eventSchema);

// creating an Auth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

// generate a url that asks permissions for Google Calendar scopes
const scopes = ['https://www.googleapis.com/auth/calendar'];


app.get('/google', (req, res) => {

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(url);
});

app.get('/google/redirect', async (req, res) => {
  console.log(req.query);
  // fetching authorization code from queryString
  const code = req.query.code;
  const scope = req.query.scope;

  // fetching access and refresh token for oAuth2 client
  const {tokens} = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens);

  // Handling refresh tokens
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
  });

  /** Once the client has a refresh token, access tokens will be acquired 
   * and refreshed automatically in the next call to the API.*/
  oauth2Client.setCredentials(tokens);

  res.send('The user has successfully logged in ');
});

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


// Create a new event
app.post('/event', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  console.log(req.body);
  const event = await calendar.events.insert({
    calendarId: 'primary',
    resource: req.body
  });
  res.send(event.data);
});


// Update an existing event
app.put('/event/:eventId', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = await calendar.events.update({
    calendarId: 'primary',
    eventId: req.params.eventId,
    resource: req.body
  });
  res.send(event.data);
});


// Delete an existing event
app.delete('/event/:eventId', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  await calendar.events.delete({
    calendarId: 'primary',
    eventId:req.params.eventId
   });
   res.send('Event deleted');
});


// Get an existing event by ID
app.get('/event/:eventId', async (req, res) => {
  const calendar = google.calendar({ version:'v3', auth : oauth2Client});
  const event=await calendar.events.get({
      calendarId:'primary',
      eventId:req.params.eventId
  });
  res.send(event.data);
});


// List all events in MongoDB
app.get('/events', async (req, res) => {
  const events=await Event.find();
  res.send(events);
});


app.listen(8000, () => console.log('Server listening on port 8000'));
