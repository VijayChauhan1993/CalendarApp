const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config({}); 

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );


// generate a url that asks permissions for Google Calendar scopes
const scopes = ['https://www.googleapis.com/auth/calendar'];

router.get('/', (req, res) => {

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  
    res.redirect(url);
  });
  
router.get('/redirect', async (req, res) => {
    console.log(req.query);
    // fetching authorization code from queryString
    const code = req.query.code;
  
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
  
module.exports = router;
