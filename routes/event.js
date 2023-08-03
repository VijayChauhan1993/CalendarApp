const Event = require('../models/event.model');
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { google } = require('googleapis');
dotenv.config({}); 

const calendar = google.calendar({
    version: 'v3',
    auth: process.env.API_KEY || ''
  });

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
);

// List all events in MongoDB
  router.get('/all', async (req, res) => {
    const events=await Event.find();
    res.send(events);
  });

// Create a new event
  router.post('/', async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log(req.body);
    const event = await calendar.events.insert({
      calendarId: 'primary',
      resource: req.body
    });
    res.send(event.data);
  });
  
// Update an existing event
  router.put('/:eventId', async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = await calendar.events.update({
      calendarId: 'primary',
      eventId: req.params.eventId,
      resource: req.body
    });
    res.send(event.data);
  }); 
  
// Delete an existing event
  router.delete('/:eventId', async (req, res) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId:req.params.eventId
     });
     res.send('Event deleted');
  });
   
// Get an existing event by ID
  router.get('/:eventId', async (req, res) => {
    const calendar = google.calendar({ version:'v3', auth : oauth2Client});
    const event=await calendar.events.get({
        calendarId:'primary',
        eventId:req.params.eventId
    });
    res.send(event.data);
  });

  module.exports = router;