const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimiter = require('express-rate-limiter');

const checkIsAuth = require('./checkIsAuth');

const corsOptions = {
    origin: true,
    methods: ["OPTIONS", "GET", "PUT", "POST", "DELETE"],
    allowedHeaders: ["Content-Type","Access-Control-Allow-Origin","Authorisation"]
};

const limiter = rateLimiter({
    windowMs: 10 * 1000, // 10 seconds
    max: 10 // limit each IP to 10 requests per 10 seconds
});

module.exports = applyMiddlewares = (app) => {
    app.use(bodyParser.json());
    app.use(cors(corsOptions));
    app.use(limiter);
    app.use(checkIsAuth);
}