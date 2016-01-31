var Botkit = require('./lib/Botkit.js');
var https = require('https');
var request = require('request');


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    debug: false
});

controller.spawn({
    token: process.env.token
}).startRTM(function(err) {
    if (err) {
        throw new Error(err);
    }
});

controller.hears(['brunch', 'brunch, anyone', 'i want brunch'], ['ambient'], function(bot, message) {
    bot.startConversation(message, askTime);
});


function askTime(response, convo) {
    convo.ask("Good morning! What time do you want to schedule brunch?", function(response, convo) {
        convo.say("Ok.")
        convo.next();
        var timeToEat = parseTime(response.text);
        confirmTime(response, convo, timeToEat);
    });
}

function confirmTime(response, convo, timeToEat) {
    try{
        timeToEat = timeToEat.toString()
        }catch(err){
            console.error(err);
            askTime(response, convo)
        }
    convo.ask("Great. To confirm, you would like to eat at " + timeToEat + "?", function(response, convo) {
        if (response.text.toLowerCase() === "no") {
            askTime(response, convo);
            convo.next()
        } else {
            convo.say("Awesome!")
            askPlace(response, convo);
            convo.next()
        }
    })
}


function askPlace(response, convo) {
    convo.ask("Do you know where you'd like to eat (type 'already know'), or do you need some suggestions (type 'need suggestions')?", function(response, convo) {
        if (response.text.toLowerCase() === 'already know') {
            console.log("hit if")
                // askForPlaces(response, convo);
        } else {
            console.log("hit else")
            askForAddress(response, convo);
            convo.next();
        }
    })
}

function askForAddress(response, convo) {
    console.log("hit address")
    convo.ask("What's your address?", function(response, convo) {
        var address = response.text;
        address = encodeURI(address);
        request('https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&key=AIzaSyAO6NjDwwJp_DWMtbEac4_AjJiwHK529L0', function(error, response, body){
            if (!error && response.statusCode == 200) {
                var body = JSON.parse(response.body)
                var lat = body.results[0].geometry.location.lat;
                var lng = body.results[0].geometry.location.lng;
                request('https://api.foursquare.com/v2/venues/explore?client_id=DVFAE2O30O0KVGMSATAJLPLZROXB3XO3SPXX1TJDPSVMQ0SS&client_secret=XNMXF23QENSBIEA1MY1Z5JJ5SFQUFXPU2DWIJVBLC5TA23D3&ll='+lat+','+lng+'&query=brunch&v=20160130', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var parsedBody = JSON.parse(response.body);
                        convo.say("I found these three brunch places near you...");
                        for(var i=0; i<3;i++){
                            console.log(parsedBody.response.groups[0].items[i].venue.name)
                            convo.say(parsedBody.response.groups[0].items[i].venue.name)
                            convo.next();
                        }
                    }else{
                        console.error(error)
                    }
                })
            }
            
        })

    })
}


function parseTime(timeString) {
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
    if (time == null) return null;

    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[4]) {
        hours = 0;
    } else {
        hours += (hours < 12 && time[4]) ? 12 : 0;
    }
    var d = new Date();
    d.setHours(hours);
    d.setMinutes(parseInt(time[3], 10) || 0);
    d.setSeconds(0, 0);
    return d;
}
