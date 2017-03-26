/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

// const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps' + '073a8f69-89a1-4299-97b8-dc4b0af6e472' + '&subscription-key=' + '0a358cfce45e422da00bd174cf3e07ae';

const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/073a8f69-89a1-4299-97b8-dc4b0af6e472?subscription-key=0a358cfce45e422da00bd174cf3e07ae&timezoneOffset=0.0&verbose=true&q=';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/

.matches('None', (session, args) => {
    session.send('Hi this is your intent handler, you said \'%s\'.', session.message.text);
})
    
.matches('weather', (session, args) => {
    session.send('You asked for weather' + JSON.stringify(args));
})

.matches('greeting', (session, args) => {
    session.send('Hi!');
})
    
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

