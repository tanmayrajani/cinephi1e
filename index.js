'use strict';

const dateFormat = require('dateformat');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const search = require('youtube-search');

const app = express();
const token = process.env.FB_PAGE_ACCESS_TOKEN;
const TMDb_API_KEY = process.env.TMDB_API_KEY;

const YOUTUBE_SEARCH_OPTS = {
    maxResults: 10,
    key: process.env.YOUTUBE_API_KEY
};

const genres = [{
        "id": 28,
        "name": "Action"
    },
    {
        "id": 12,
        "name": "Adventure"
    },
    {
        "id": 16,
        "name": "Animation"
    },
    {
        "id": 35,
        "name": "Comedy"
    },
    {
        "id": 80,
        "name": "Crime"
    },
    {
        "id": 99,
        "name": "Documentary"
    },
    {
        "id": 18,
        "name": "Drama"
    },
    {
        "id": 10751,
        "name": "Family"
    },
    {
        "id": 14,
        "name": "Fantasy"
    },
    {
        "id": 36,
        "name": "History"
    },
    {
        "id": 27,
        "name": "Horror"
    },
    {
        "id": 10402,
        "name": "Music"
    },
    {
        "id": 9648,
        "name": "Mystery"
    },
    {
        "id": 10749,
        "name": "Romance"
    },
    {
        "id": 878,
        "name": "Science Fiction"
    },
    {
        "id": 10770,
        "name": "TV Movie"
    },
    {
        "id": 53,
        "name": "Thriller"
    },
    {
        "id": 10752,
        "name": "War"
    },
    {
        "id": 37,
        "name": "Western"
    }
]

var natural = require('natural'),
    metaphone = natural.Metaphone,
    soundEx = natural.SoundEx;

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
});

app.get('/privacy', function (req, res) {
    res.send('<h2 style="padding: 30px; font-family: consolas; text-decoration:underline">The Cinephile</h2><p style="font-family: consolas; font-size: 18px; padding: 10px 30px">This is built solely for learning purposes and is not intended for any kind of commercial activity and hence we do not collect any kind of user\'s personal information at all. We honor user\'s privacy and do not track anything at all. It is not developed in order to attract anyone under 13.</p>');
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'stormy-ocean-5283-tanmayrajani') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
});

function sendTextMessage(sender, text) {
    console.log('Responding to: ' + sender + '\nWith: "' + text + '"');
    let messageData = {
        text: text
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: messageData
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendTextMessagePromise(sender, text) {
    console.log('Responding to: ' + sender + '\nWith: "' + text + '"');
    let messageData = {
        text: text
    };
    return new Promise(function (resolve, reject) {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error);
                reject(error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
            resolve(response);
        })
    })

}

function sendImage(sender, imgUrl) {
    console.log('Responding to: ' + sender + '\nWith: "' + imgUrl + '"');
    let messageData = {
        "attachment": {
            "type": "image",
            "payload": {
                "url": String(imgUrl)
            }
        }
    };
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: messageData
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function selectAtRandom(listOfTexts) {
    return listOfTexts[Math.floor(Math.random() * listOfTexts.length)];
}

function changeText(text) {
    if (text.indexOf('are you') >= 0 || metaphone.compare(text, "are you") || soundEx.compare(text, "are you")) {
        let returnText;
        if (text.indexOf('how') >= 0) {
            returnText = selectAtRandom(["I'm good..\nhow about you?", "Umm.. I'm okay..", "Not bad..", "I'm great..", "I am doing good..", "doing good these days :)\nyou say.."]);
        } else {
            returnText = text.replace('are you', 'I am');
            returnText = returnText.replace('?', '.');
        }
        return returnText;
    } else if (text.indexOf('you are') >= 0) {
        return text.replace('you are', 'I am');
    } else if (text === 'weather') {
        return "since when did you start giving shit about weather?";
    }
    return text;
}

function changeTextNatural(text) {
    // Although there is an invalid regex exception guard, we might want to go soft on the user and ignore unintentional (or intentional) use of parenthesis:
    var text2 = text.replace(/\(|\)|\?|\*/g, "");
    try {
        if (metaphone.compare(text2, "how are you") || soundEx.compare(text2, "how are you")) {
            return selectAtRandom(["I'm good..\nhow about you?", "Umm.. I'm okay..", "Not bad..", "I'm great..", "I am doing good..", "doing good these days :)\nyou say.."]);
        } else if (text2 == "" || metaphone.compare(text2, "hey") || soundEx.compare(text2, "hey") || metaphone.compare(text2, "hello") || soundEx.compare(text2, "hello") || metaphone.compare(text2, "hi") || soundEx.compare(text2, "hi") || metaphone.compare(text2, "help") || soundEx.compare(text2, "help") || metaphone.compare(text2, "hey there") || soundEx.compare(text2, "hey there")) {
            let punches = ["PS. YOU DO NOT TALK ABOUT FIGHT CLUB", "It's Groundhog day :)", "PS. I've got to return some videotapes!", "Let's put a smile on that face! :D", "Hasta la vista, baby :)", "PS. They call it Royale with cheese.", "Carpe diem. Seize the day, boys.", "PS. I see dead people. :|", "May the Force be with you.", "Life is like a box of chocoloates! :)"];
            return "Hey! I'm a Messenger bot. I suggest movies, provide movie details, etc\n\nUse #plot, #suggest or #meta with movie name or #starring with person name\n\n#plot gives movie summary, #suggest lists similar movies, #meta, ratings, trailer and poster, #starring lists popular movies of actor\n\n" + selectAtRandom(punches);
        }
    } catch (err) {
        // This is a guard to catch any invalid regex errors.
        console.log("Caught error; Continuing as if nothing happened: " + err);
        return "English motherf**ker, do you speak it?!";
    }
    return "Doesn't look like anything to me!";
}

function sendTextChunks(sender, text, title) {
    if (text.length < 320) {
        sendTextMessage(sender, text);
        return;
    }
    let sentences = text.split('.');
    sentences.reduce(function (p, sentence) {
        return p.then(function () {
            return sendTextMessagePromise(sender, sentence);
        });
    }, sendTextMessagePromise(sender, title)); // initial
}

function sendTextLists(sender, sentences) {
    sentences.reduce(function (p, sentence) {
        return p.then(function () {
            return sendTextMessagePromise(sender, sentence);
        });
    });
}

function findSimilarMovies(sender, titleText, genre_ids, fromMovieId) {
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        var results = jsonbody.results.filter(function (movie) {
            return movie.id !== fromMovieId && movie.original_language === 'en';
        });
        if (results.length > 0) {
            let length = results.length > 4 ? 5 : results.length;
            let suggestions = [];
            for (let i = 0; i < length; i++) {
                let suggestion = results[i].original_title;
                if (results[i].release_date) {
                    let releaseDate = new Date(results[i].release_date);
                    suggestion += " (" + releaseDate.getFullYear() + ")";
                }
                suggestions.push(suggestion);
            }

            suggestions.reduce(function (p, suggestion) {
                return p.then(function () {
                    return sendTextMessagePromise(sender, suggestion);
                });
            }, sendTextMessagePromise(sender, titleText));

        } else {
            sendTextMessage(sender, "Couldn't find similar movies it seems! :(")
        }
    });
}

function sendMovieSuggestions(sender, searchQuery) {
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        if (jsonbody.total_results > 0) {
            let prepareText = "Here are some movies related to " + jsonbody.results[0].original_title;
            if (jsonbody.results[0].release_date) {
                let releseDate = new Date(jsonbody.results[0].release_date);
                prepareText += " (" + releseDate.getFullYear() + ")";
            }
            prepareText += ".. Hope you'll enjoy them! :)";
            findSimilarMovies(sender, prepareText, jsonbody.results[0].genre_ids, jsonbody.results[0].id);
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        if (jsonbody.total_results > 0) {
            let prepareText = jsonbody.results[0].original_title;
            if (jsonbody.results[0].release_date) {
                let releseDate = new Date(jsonbody.results[0].release_date);
                prepareText += " (" + releseDate.getFullYear() + ")";
            }
            sendTextChunks(sender, jsonbody.results[0].overview, prepareText);
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        if (jsonbody.results.length) {
            let moviesLength = jsonbody.results.length > 4 ? 5 : jsonbody.results.length;
            for (let i = 0; i < moviesLength; i++) {
                let suggestion = jsonbody.results[i].original_title;
                if (jsonbody.results[i].release_date) {
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        if (jsonbody.results.length) {
            searchMovieByPerson(sender, jsonbody.results[0].id);
        } else {
            sendTextMessage(sender, "Duh! Didn't get you.. ")
        }
    });
}

function sendTrailerButtonWithTextAndPoster(sender, moviedata, text) {
    getTrailerLink(moviedata.title).then(function (trailerLink) {
        let messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": text,
                    "buttons": [{
                        "type": "web_url",
                        "url": trailerLink,
                        "title": "Watch Trailer"
                    }]
                }
            }
        }

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
            if (moviedata.poster_path) {
                sendImage(sender, "https://image.tmdb.org/t/p/w500" + moviedata.poster_path);
            }
        })
    }, function () { // error callback; send text and poster without trailer button
        sendTextMessage(sender, text);
        if (moviedata.poster_path) {
            sendImage(sender, "https://image.tmdb.org/t/p/w500" + moviedata.poster_path);
        }
    })

}

function sendMovieMetadata(sender, text) {
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
        if (error) {
            console.log(response);
            throw new Error(error);
        }
        var jsonbody = JSON.parse(body);
        if (jsonbody.total_results > 0) {
            let moviedata = jsonbody.results[0]
            let response = moviedata.title + "\n";

            if (moviedata.vote_average) {
                response += "Vote Average: " + moviedata.vote_average + " / 10\n";
            }

            if (moviedata.genre_ids && moviedata.genre_ids.length) {
                let genre_names = genres.reduce(function (arr, obj) {
                    if (moviedata.genre_ids.indexOf(obj.id) > -1) {
                        arr.push(obj.name)
                    }
                    return arr;
                }, [])
                if (genre_names) {
                    response += "Genre: " + genre_names.join(", ") + "\n"
                }
            }

            if (moviedata.release_date) {
                response += "Release Date: " + dateFormat(new Date(moviedata.release_date), "dddd, mmmm dS, yyyy")
            }
            sendTrailerButtonWithTextAndPoster(sender, moviedata, response);
        } else {
            sendTextMessage(sender, "Duh! Nothing found..");
        }
    });

}

// function by @beingadityak
// function for getting youtube link
function getTrailerLink(searchstring) {
    var ytlink = null;
    var searchtext = searchstring + " trailer";
    return new Promise(function (resolve, reject) {
        search(searchtext, YOUTUBE_SEARCH_OPTS, function (err, results) {
            if (err) {
                console.log(err);
                reject(err);
            }
            for (var i = 0; i < results.length; i++) {
                var title = results[i].title;
                if (title.toLowerCase().indexOf("official trailer") !== -1 || title.toLowerCase().indexOf("trailer") !== -1) {
                    resolve(results[i].link);
                    break;
                }
            }
        });
    });
}

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        console.log('Sender ID:' + sender);
        if (event.message && event.message.text) {
            let text = event.message.text.toLowerCase();
            console.log('Msg text: "' + text + '"');

            if ((text.indexOf('#plot') === 0 && text.indexOf('#plot ') !== 0) ||
                (text.indexOf('#suggest') === 0 && text.indexOf('#suggest ') !== 0) ||
                (text.indexOf('#starring') === 0 && text.indexOf('#starring ') !== 0) ||
                (text.indexOf('#meta') === 0 && text.indexOf('#meta ') !== 0)) {
                sendTextMessage(sender, "Something went wrong. You mistyped something it looks like!")
            } else if (text.indexOf('#plot ') === 0) {
                sendMoviePlot(sender, text.substring(text.indexOf(' ') + 1));
            } else if (text.indexOf('#suggest ') === 0) {
                sendMovieSuggestions(sender, text.substring(text.indexOf(' ') + 1));
            } else if (text.indexOf('#starring ') === 0) {
                sendPersonMoviesData(sender, text.substring(text.indexOf(' ') + 1));
            } else if (text.indexOf('#meta ') === 0) {
                sendMovieMetadata(sender, text.substring(text.indexOf(' ') + 1));
            } else {
                sendTextMessage(sender, changeTextNatural(text.substring(0, 319)));
            }
        } else if (event.postback && event.postback.payload) {
            sendTextMessage(sender, changeTextNatural(event.postback.payload));
        }
    }
    res.sendStatus(200);
});

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
});