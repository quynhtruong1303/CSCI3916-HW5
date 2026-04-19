/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */
require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var mongoose = require('mongoose');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

// Helper provided by the instructor scaffold — builds a standard JSON object
// containing request headers, a unique key from env vars, and the request body.
// Referenced by UNIQUE_KEY environment variable (used for analytics/tracking).
function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

// ----- Auth Routes -----

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            return res.send(err);
        }

        if (!user) {
            return res.status(401).send({ success: false, msg: 'Authentication failed. User not found.'});
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

// ----- Movie Routes -----

router.route('/movies')
    // GET all movies - if ?reviews=true, aggregate reviews with each movie
    .get(authJwtController.isAuthenticated, function(req, res) {
        if (req.query.reviews === 'true') {
            // Use MongoDB $lookup to join the reviews collection into the movies results
            Movie.aggregate([
                {
                    $lookup: {
                        from: 'reviews',    // the MongoDB collection name
                        localField: '_id',  // Movie's _id field
                        foreignField: 'movieId',    // Review's movieId field
                        as: 'reviews'       // output array field name
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$reviews.rating' }
                    }
                },
                {
                    $sort: { avgRating: -1 }
                }
            ]).exec(function(err, movies) {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message});
                }
                res.json(movies);
            });
        } else {
            // Return movies without reviews
            Movie.find(function(err, movies) {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message});
                }
                res.json(movies);
            });
        }
    })
    // POST a new movie - requires JWT
    .post(authJwtController.isAuthenticated, function(req, res) {
        if (!req.body.actors || req.body.actors.length === 0) {
            return res.status(400).json({ success: false, message: 'Movie must include at least one actor.'});
        }
        var movie = new Movie();
        movie.title = req.body.title;
        movie.releaseDate = req.body.releaseDate;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;
        movie.imageUrl = req.body.imageUrl;

        movie.save(function(err) {
            if (err) {
                return res.status(400).json({success: false, message: err.message});
            }
            res.status(200).json({ success: true, message: 'Movie saved.', movie: movie});
        });
    })
    .put(authJwtController.isAuthenticated, function(req, res) {
        res.status(405).json({ success: false, message: 'PUT not supported on /movies. Use /movies/:movieId.' });
    })
    .delete(authJwtController.isAuthenticated, function(_req, res) {
        res.status(405).json({ success: false, message: 'DELETE not supported on /movies. Use /movies/:movieId.' });
    });

router.route('/movies/:movieId')
    // GET a single movie by ID - if ?reviews=true, include its reviews via $lookup
    .get(authJwtController.isAuthenticated, function(req, res) {
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.params.movieId) } },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'movieId',
                        as: 'reviews'
                    }
                },
                {
                    // Calculate average rating from the joined reviews array
                    $addFields: {
                        avgRating: { $avg: '$reviews.rating' }
                    }
                }
            ]).exec(function(err, result) {
                if (err) { return res.status(500).json({ success: false, message: err.message }); }
                if (!result || result.length === 0) { return res.status(404).json({ success: false, message: 'Movie not found.' }); }
                res.json(result[0]); // aggregate returns an array; send the first (and only) item
            });
        } else {
            Movie.findById(req.params.movieId, function(err, movie) {
                if (err) { return res.status(500).json({ success: false, message: err.message }); }
                if (!movie) { return res.status(404).json({ success: false, message: 'Movie not found.' }); }
                res.json(movie);
            });
        }
    })
    .put(authJwtController.isAuthenticated, function(req, res) {
        Movie.findByIdAndUpdate(
            req.params.movieId,
            req.body,
            { new: true, runValidators: true },
            function(err, movie) {
                if (err) { return res.status(400).json({ success: false, message: err.message }); }
                if (!movie) { return res.status(404).json({ success: false, message: 'Movie not found.' }); }
                res.json({ success: true, message: 'Movie updated.', movie: movie });
            }
        );
    })
    .delete(authJwtController.isAuthenticated, function(req, res) {
        Movie.findByIdAndRemove(req.params.movieId, function(err, movie) {
            if (err) { return res.status(500).json({ success: false, message: err.message }); }
            if (!movie) { return res.status(404).json({ success: false, message: 'Movie not found.' }); }
            res.json({ success: true, message: 'Movie deleted.' });
        });
    });

// ----- Review Routes -----

router.route('/reviews')
    // GET all reviews (no auth required — useful for testing)
    .get(authJwtController.isAuthenticated, function(req, res) {
        Review.find(function(err, reviews) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json(reviews);
        });
    })
    // POST a new review — JWT required; username comes from the token, not the request body
    .post(authJwtController.isAuthenticated, function(req, res) {
        // Verify the referenced movie actually exists before saving the review
        Movie.findById(req.body.movieId, function(err, movie) {
            if (err)    return res.status(500).json({ success: false, message: err.message });
            if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });

            var review = new Review();
            review.movieId  = req.body.movieId;
            // Pull the username directly from the decoded JWT payload (req.user set by passport)
            review.username = req.user.username;
            review.review   = req.body.review;
            review.rating   = req.body.rating;

            review.save(function(err) {
                if (err) return res.status(400).json({ success: false, message: err.message });
                // Assignment requires this exact response message
                res.status(200).json({ message: 'Review created!' });
            });
        });
    });

// POST /search — extra credit: partial match on title or actor name
router.post('/search', authJwtController.isAuthenticated, function(req, res) {
    var term = req.body.title || req.body.actorName || '';
    if (!term) return res.status(400).json({ success: false, message: 'Provide title or actorName to search.' });
    var regex = new RegExp(term, 'i');
    Movie.find({
        $or: [
            { title: regex },
            { 'actors.actorName': regex }
        ]
    }, function(err, movies) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(movies);
    });
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


