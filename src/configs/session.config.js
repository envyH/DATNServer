
require("dotenv").config();
const sessionConfig = {
    secret: process.env.STECH_SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
    },
};

module.exports = sessionConfig;