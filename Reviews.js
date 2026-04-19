var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var ReviewSchema = new Schema({
    // ObjectId reference to the Movie collection
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    // Username is pulled from the JWT token at POST time, not user-supplied
    username: { type: String, required: true},
    review: { type: String, required: true},
    rating: { 
        type: Number,
        min: 0,
        max: 5,
        required: true
    }
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);