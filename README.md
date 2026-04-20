# CSC3916 Assignment 5 - Movie API with Reviews & Image Support

## Description
A RESTful API built with Node.js, Express, and MongoDB that supports movies (with poster images), user reviews, and JWT authentication.
All endpoints are protected by JWT. Reviews are aggregated with movies using MongoDB's `$lookup` operator and sorted by average rating descending.

## Installation
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with the following variables:
```
DB=your_mongodb_connection_string
SECRET_KEY=your_secret_key
UNIQUE_KEY=your_unique_key
```
4. Run `npm start`

## API Endpoints
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /signup | No | Register a new user |
| POST | /signin | No | Login and receive JWT token |
| GET | /movies | Yes | Get all movies |
| POST | /movies | Yes | Add a new movie (include imageUrl) |
| GET | /movies/:movieId | Yes | Get movie by ID |
| PUT | /movies/:movieId | Yes | Update a movie |
| DELETE | /movies/:movieId | Yes | Delete a movie |
| GET | /reviews | Yes | Get all reviews |
| POST | /reviews | Yes | Add a review (username pulled from JWT) |
| POST | /search | Yes | Search movies by partial title or actor name |

## Usage
Add `?reviews=true` to any GET movie request to include aggregated reviews and average rating, sorted by rating descending:
```
GET /movies?reviews=true
GET /movies/:movieId?reviews=true
```

Search by partial title or actor name:
```
POST /search
{ "title": "dark" }
{ "actorName": "Ledger" }
```

## Deployed API
https://csci3916-hw5-qrly.onrender.com

## React Frontend
https://github.com/quynhtruong1303/CSCI3916-Movie-App-Project

## Postman Test Collection
[View Postman Collection and Environment](postman/)
