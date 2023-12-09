require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
const authRoute = require('./Routes/Auth.route');
const { verifyAccessToken } = require('./helpers/jwt_helper');
require('./helpers/init_mongodb');
require('./helpers/init_redis');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/protectedRoute', verifyAccessToken, (req, res, next) => {
    res.send('Hello from protected route !');
});
app.use('/auth', authRoute);

app.use(async (req, res, next) => {
    next(createError.NotFound());
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));