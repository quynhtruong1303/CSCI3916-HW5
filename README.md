# CSC3916 Assignment 4 - Movie API with Reviews

## Description
A RESTful API built with Node.js, Express, and MongoDB that supports movies and user reviews.
Users can sign up, sign in with JWT authentication, manage movies, and submit reviews.
Reviews are aggregated with movies using MongoDB's `$lookup` operator.

## Installation
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with the following variables:
```
DB=your_mongodb_connection_string
SECRET_KEY=your_secret_key
UNIQUE_KEY=your_unique_key
```
4. Run `node server.js`

## API Endpoints
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /signup | No | Register a new user |
| POST | /signin | No | Login and receive JWT token |
| GET | /movies | Yes | Get all movies |
| POST | /movies | Yes | Add a new movie |
| GET | /movies/:movieId | Yes | Get movie by ID |
| PUT | /movies/:movieId | Yes | Update a movie |
| DELETE | /movies/:movieId | Yes | Delete a movie |
| GET | /reviews | Yes | Get all reviews |
| POST | /reviews | Yes | Add a review (username pulled from JWT) |

## Usage
Add `?reviews=true` to any GET movie request to include aggregated reviews and average rating:
```
GET /movies?reviews=true
GET /movies/:movieId?reviews=true
```

## Deployed API
https://csci3916-hw4-g2px.onrender.com

## Postman Test Collection
[View Postman Collection and Environment](postman/)


