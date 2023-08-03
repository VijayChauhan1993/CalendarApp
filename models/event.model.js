const mongoose = require('mongoose');

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

module.exports = Event;