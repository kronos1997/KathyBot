'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
var apiai = require('apiai');
var fs = require('fs')

const token = "EAASY3NeVb50BANzTO31IRKA95x0NLCFjLuUStiR0YudSNuWcUlpw7qY0Kqdac5rkgpUs2ykQsHRZCw4ZCkUzMrQZCyDO1GGGPHstPpa079CFa9tPuCHdD01X7x02xp9lTk0ZAB56ZAhji4ZA8DSwisWriR9ZBvNWa3NCwj11V7f9wZDZD";

app.set('port', (process.env.PORT || 8080));

var apiapp = apiai("fafcfcb0ba504515b7ce8831df877603");

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Process application/json
app.use(bodyParser.json());

// Index route
//app.get('/', function (req, res) {
//    res.send('Hello world, I am a chat bot')
//});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'winbotv2_verify') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong token');
    }
});

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text

            var request = apiapp.textRequest(text);

            request.on('response', function (response) {
                if (response.result.metadata.intentName == "Greeting") {
                    if (response.result.actionIncomplete) {
                        sendTextMessage(sender, response.result.fulfillment.speech)
                    } else {
                        var messageData = {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "button",
                                    "text": "Hello, submit a photo to receive your lucky digit!",
                                    "buttons": []
                                }
                            }
                        };
                        messageData.attachment.payload.buttons.push({ "type": "web_url", "url": "google.com", "title": "Visit Website" }, { "type": "postback", "title": "Submit", "payload": "submit" });
                        sendGenericMessage(sender, messageData)
                    }
                }
                console.log(response);
            });

            request.on('error', function (error) {
                console.log(error);
            });

            request.end()
            /*if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))*/
        } else if (event.postback) {
            var payload = event.postback.payload
            if (payload == "vote") {
                var messageData = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": []
                        }
                    }
                };
                fs.readFile('host', 'utf8', function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(data);
                    var urls = data.split("|");
                    var u = Math.floor(Math.random() * (urls.length - 0));
                    var value = { "title": "Choose to vote or go to next picture.", "subtitle": "Vote or Next?", "image_url": urls[u], "buttons": [{ "type": "postback", "title": "Vote", "payload": "voted:" + urls[u] }, { "type": "postback", "title": "Next", "payload": "vote" }, { "type": "web_url", "url": urls[u], "title": "Zoom" }] };
                    messageData.attachment.payload.elements.push(value);
                    sendGenericMessage(sender, messageData)
                });
            } else if (payload == "submit") {
                sendTextMessage(sender, "Please submit your photo.")
            } else if (payload.indexOf('voted:') > -1) {
                var votes = payload.substring(payload.indexOf('voted:') + 6);
                fs.appendFile("votes", "|" + votes, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                });
                var messageData = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "button",
                            "text": "Thank you! Your vote have been collected! Would you like to submit more photos or vote?",
                            "buttons": []
                        }
                    }
                };
                messageData.attachment.payload.buttons.push({ "type": "postback", "title": "Vote", "payload": "vote" }, { "type": "postback", "title": "Submit", "payload": "submit" });
                sendGenericMessage(sender, messageData)
            }
        } else if (event.message && event.message.attachments) {
            var url = event.message.attachments[0].payload.url;
            fs.appendFile("host", "|" + url, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            var messageData = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "Thank you! Your photo have been submitted. View your lucky digits!",
                        "buttons": []
                    }
                }
            };
            messageData.attachment.payload.buttons.push({ "type": "web_url", "url": "matthew-wee.com/LuckyNumber", "title": "Lucky Digits" });
            sendGenericMessage(sender, messageData)
        }
    }
    res.sendStatus(200);
});

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
});

function sendTextMessage(sender, text) {
    let messageData = { text: text };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}

function sendGenericMessage(sender, messageData) {
    /*let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": msg,
                    "subtitle": des,
                    "image_url": img,
                    "buttons": [{
                        "type": "web_url",
                        "url": url,
                        "title": "Deep Link"
                    }],
                }]
            }
        }
    }*/
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}