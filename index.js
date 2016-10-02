'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = process.env.FB_PAGE_ACCESS_TOKEN;
const TMDb_API_KEY = process.env.TMDB_API_KEY;

var natural = require('natural'),
    metaphone = natural.Metaphone, soundEx = natural.SoundEx, NGrams = natural.NGrams;

var searchTerm = '';
var url = "http://www.google.co.in/search?q="+searchTerm+"&cad=h";
app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
})

app.get('/privacy', function (req, res) {
    res.send('<h2 style="padding: 30px; font-family: consolas; text-decoration:underline">The Cinephile</h2><p style="font-family: consolas; font-size: 18px; padding: 10px 30px">This is built solely for learning purposes and is not intended for any kind of commercial activity and hence we do not collect any kind of user\'s personal information at all. We honor user\'s privacy and do not track anything at all. It is not developed in order to attract anyone under 13.</p>');
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'stormy-ocean-5283-tanmayrajani') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function changeText(text) {
    if(text.indexOf('are you') >= 0 || metaphone.compare(text, "are you") || soundEx.compare(text, "are you")) {
        let returnText;
        console.log("here")
        if(text.indexOf('how') >= 0) {
            let returnTexts = ["I'm good..\nhow about you?", "Umm.. I'm okay..", "Not bad..", "I'm great..", "I am doing good..", "doing good these days :)\nyou say.."];
            returnText = returnTexts[Math.round(Math.random()*6)];
        } else {
            returnText = text.replace('are you', 'I am');
            returnText = returnText.replace('?','.');
        }
        return returnText;
    } else if(text.indexOf('you are') >= 0) {
        return text.replace('you are', 'I am');
    } else if(text === 'weather') {
        return "since when did you start giving shit about weather?";
    }
    return text;
}

function changeTextNatural(text) {
    var returnText = text; 
    if(metaphone.compare(text, "how are you") || soundEx.compare(text, "how are you")) {
        let returnTexts = ["I'm good..\nhow about you?", "Umm.. I'm okay..", "Not bad..", "I'm great..", "I am doing good..", "doing good these days :)\nyou say.."];
        returnText = returnTexts[Math.round(Math.random()*5)];
    } else if(metaphone.compare(text, "hey") || soundEx.compare(text, "hey") || metaphone.compare(text, "hello") || soundEx.compare(text, "hello") || metaphone.compare(text, "hi") || soundEx.compare(text, "hi") || metaphone.compare(text, "help") || soundEx.compare(text, "help")) {
        let punches = ["PS. YOU DO NOT TALK ABOUT FIGHT CLUB", "It's Groundhog day :)", "PS. I've got to return some videotapes!", "Let's put a smile on that face! :D", "Hasta la vista, baby :)", "PS. They call it Royale with cheese.", "Carpe diem. Seize the day, boys.", "PS. I see dead people. :|", "PS. May the Force be with you.", "PS. Life is like a box of chocoloates! :)"];
        returnText = "Hey! I'm a Messenger bot. I suggest movies, provide plot summary, etc.\n\nUse #plot <movie> for plot summary of a movie\n#suggest <movie> to find similar movies\n#starring <person> for popular movies of that actor/actress\n\n"
        returnText += punches[Math.round(Math.random()*9)];
    }
    return returnText;
}

function sendTextChunks(sender, text) {
    if(text.length < 320) {
        sendTextMessage(sender, text);
        return;
    }
    let sentences = text.split('.');
    for (var i = 0; i < sentences.length - 1; i++) {
        sendTextMessage(sender, sentences[i]);
    };
}

function findSimilarMovies(sender, genre_ids, fromMovieId) {
    var options = { 
        method: 'GET',
        url: 'http://api.themoviedb.org/3/discover/movie',
        qs: { 
            with_genres: genre_ids.join(),
            sort_by: 'popularity.desc',
            'vote_average.gte': 5.5,
            include_video: false,
            include_adult: true,
            language: 'en',
            api_key: TMDb_API_KEY
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var jsonbody = JSON.parse(body);
        var results = jsonbody.results.filter(function(movie) {
            return movie.id !== fromMovieId && movie.original_language === 'en';
        })
        if(results.length > 0) {
            let length = results.length > 4 ? 5 : results.length;
            for(let i=0; i<length; i++) {
                let suggestion = results[i].original_title;
                if(results[i].release_date) {
                    let releseDate = new Date(results[i].release_date);
                    suggestion += " (" + releseDate.getFullYear() + ")";
                } 
                sendTextMessage(sender, suggestion);
            }
        } else {
            sendTextMessage(sender, "Something went wrong.. I'm working on it though!")
        }
    });
}

function sendMovieData(sender, searchQuery) {
    var options = { 
        method: 'GET',
        url: 'http://api.themoviedb.org/3/search/movie',
        qs: { 
            query: String(searchQuery),
            include_adult: true,
            language: 'en',
            api_key: TMDb_API_KEY 
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var jsonbody = JSON.parse(body);
        if(jsonbody.total_results > 0) {
            let prepareText = "Here are some movies related to "+ jsonbody.results[0].original_title;
            if(jsonbody.results[0].release_date) {
                let releseDate = new Date(jsonbody.results[0].release_date);
                prepareText += " (" + releseDate.getFullYear() + ")";
            } 
            prepareText += ".. Hope you'll enjoy them! :)";
            sendTextMessage(sender, prepareText);
            setTimeout(findSimilarMovies(sender, jsonbody.results[0].genre_ids, jsonbody.results[0].id), 1500);
        } else {
            sendTextMessage(sender, "Duh! Nothing found..");
        }
    });

}

function sendMoviePlot(sender, text) {
    var options = { 
        method: 'GET',
        url: 'http://api.themoviedb.org/3/search/movie',
        qs: { 
            query: String(text),
            include_adult: true,
            language: 'en',
            api_key: TMDb_API_KEY 
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var jsonbody = JSON.parse(body);
        if(jsonbody.total_results > 0) {
            let prepareText = jsonbody.results[0].original_title;
            if(jsonbody.results[0].release_date) {
                let releseDate = new Date(jsonbody.results[0].release_date);
                prepareText += " (" + releseDate.getFullYear() + ")";
            } 
            sendTextMessage(sender, prepareText);
            setTimeout(sendTextChunks(sender, jsonbody.results[0].overview), 1500);
        } else {
            sendTextMessage(sender, "Duh! Nothing found..");
        }
    });

}

function searchMovieByPerson(sender, person_id) {
    var options = { 
        method: 'GET',
        url: 'http://api.themoviedb.org/3/discover/movie',
        qs: { 
            with_cast: String(person_id),
            include_adult: true,
            api_key: TMDb_API_KEY 
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var jsonbody = JSON.parse(body);
        if(jsonbody.results.length) {
            let moviesLength = jsonbody.results.length > 4 ? 5 : jsonbody.results.length;
            for(let i=0; i<moviesLength; i++) {
                let suggestion = jsonbody.results[i].original_title;
                if(jsonbody.results[i].release_date) {
                    let releseDate = new Date(jsonbody.results[i].release_date);
                    suggestion += " (" + releseDate.getFullYear() + ")";
                } 
                sendTextMessage(sender, suggestion);
            }
        } else {
            sendTextMessage(sender, 'No movies by that actor found.. Hard luck!');
        }
    });
}

function sendPersonMoviesData(sender, person) {
    var options = { 
        method: 'GET',
        url: 'http://api.themoviedb.org/3/search/person',
        qs: { 
            query: String(person),
            include_adult: true,
            api_key: TMDb_API_KEY 
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var jsonbody = JSON.parse(body);
        if(jsonbody.results.length) {
            searchMovieByPerson(sender, jsonbody.results[0].id);
        } else {
            sendTextMessage(sender, "Duh! Didn't get you.. ")
        }
    });
}


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text.toLowerCase();
            if(text.indexOf('?') === 0){
                // The '?' alone as a message was invalid regex and crashed the server. :D 
                // This is temporary fix. Maybe we can validate the regex before passing text to soundEx / metaphone
                res.sendStatus(200);
                return;
            } else if((text.indexOf('#plot') === 0 && text.indexOf('#plot ') !== 0) || (text.indexOf('#suggest') === 0 && text.indexOf('#suggest ') !== 0) || (text.indexOf('#starring') === 0 && text.indexOf('#starring ') !== 0)){
                sendTextMessage(sender, "Something went wrong. You mistyped something it looks like!")
            } else if(text.indexOf('#plot ') === 0) {
                sendMoviePlot(sender, text.substring(text.indexOf(' ') + 1));
            } else if(text.indexOf('#suggest ') === 0) {
                sendMovieData(sender, text.substring(text.indexOf(' ') + 1));
            } else if(text.indexOf('#starring ') === 0) {
                sendPersonMoviesData(sender, text.substring(text.indexOf(' ') + 1));
            } else {
                sendTextMessage(sender, changeTextNatural(text.substring(0,319)));
            }
        }
    }
    res.sendStatus(200)
})

app.listen(app.get('port'), function() {
    // console.log(sendMovieData(process.argv[2]))
    console.log('running on port', app.get('port'))
})