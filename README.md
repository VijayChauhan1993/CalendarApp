# CalendarApp
Minimal calendar backend application using Node.js and MongoDB for syncing google calendar events.

## STEPS TO RUN THE PROJECT:
 1. ```cd CalendarApp ```
 2. run ```npm i```
 3. ```npm start``` to start the project
 4. use ```/google``` to authenticate the user before using any other API. This will help us set an OAuth2Client.
 5. use ```/events``` APIs for event related operations
 6. use ```/sync``` API is for syncing all the changes to mongoDB.