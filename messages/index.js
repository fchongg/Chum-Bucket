/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var http = require('http');
var https = require('https');
var request = require("superagent");
var url = require("url");
var uuid = require("uuid");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

var AzureSearch = require('azure-search');
var client = AzureSearch({
    url: "https://frances-bot.search.windows.net",
    key:"61B7D0187DBCC84B1F2B5C1473B8E6A4"
});

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
    // session.send('Hi this is your intent handler, you said \'%s\'.', session.message.text);
})
    
// .matches('weather', (session, args) => {
//     session.send('You asked for weather' + JSON.stringify(args));
// })

.matches('bye', (session, args) => {
    session.send('Bye, have a nice day!');
})

.matches('greeting', (session, args) => {
    session.send('Hi!');
})

.matches('search', (session, args) => {
    const valid_urls = args.entities.filter((entity)=>{
        return entity.type=='search_key';
    });
    
    const search_string = valid_urls.map((entity)=>entity.entity).join(" ");
    client.search("htmldata", {search:search_string}, (err, results,raw)=>{
            if (err){
                session.send(JSON.stringify(err));
            }
            else {
                var links = (results.map((res)=>`${res.title} - ${res.link} :cat2:`));
                
                var unique = links.filter(function(elem, index, self) {
                    return index == self.indexOf(elem);
                })
                
                unique.forEach( ( unique)=>{ session.send( unique ) } );
                //session.send(JSON.stringify(unique));
            }
    });
    
    
})

.matches('url', (session, args) => {
    
    const valid_urls = args.entities.filter((entity)=>{
        return entity.type=='urlValid';
    });
    
    
    valid_urls.forEach((validUrl)=>{
        var urlString = validUrl.entity;
        urlString =  urlString.split(" ").join("");
        urlString = url.parse(urlString).href.replace("%3C", "").replace("%3E", "");

        saveUrl(session, urlString, (err, results)=>{
            if (err){
                // session.send(JSON.stringify(err));
            }
            else {
                // session.send(JSON.stringify(results));
            }
        })
    })
    
   
})
    
.onDefault((session) => {
    // session.send('Sorry, I did not understand \'%s\'.', session.message.text);
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

function http_Get(url_1,  next){
    try
    {
        request
   .get(url_1)
   .end(function(err, res){
     if (err || !res.ok) {
         next(err);
     } else {
         
        const title = getTag(res.text, 'title');
        const body = getTag(res.text, 'body');
        next(null,{title, body});
     }
   });
    }
    catch (err){
         next(err);
    }
} 


function saveUrl(session, validUrl, next){
    
    http_Get( validUrl,  ( err, response)=>{
        if (err){
            return next(err);
        }
        const linktosave = {
            "id": uuid.v4(), 
            "conversationId": session.message.address.conversation.id,
            "title": response.title ,
            "body": response.body, 
            "link":validUrl,
            "user": session.message.user.name
        };
        client.addDocuments("htmldata", [linktosave], next);
        
    })
    
}


function getTag(res_text, tag){
    var start = res_text.indexOf(`<${tag.toLowerCase()}`);
    var end = res_text.indexOf(`</${tag.toLowerCase()}>`);

    if (start == -1){
        start = res_text.indexOf(`<${tag.toUpperCase()}`);
        end = res_text.indexOf(`</${tag.toUpperCase()}>`);
    }

    if (start == -1){
        return "";
    }

    return res_text.substring(start+(tag.length)+2, end);
}
 