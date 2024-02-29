require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const createError = require("http-errors");
const compression = require('compression');
const { default: helmet } = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    // Socket.IO options
});

// init Firebase admin
const { admin } = require('./src/configs/firebase/index');

const sessionConfig = require('./src/configs/session.config');

// view engine setup
app.set("views", path.join(__dirname, "/src/views"));
app.set("view engine", "pug");

app.use(cors());
app.use(morgan("dev"));
app.use(helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
}),
);
app.use(compression());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/src/public")));
app.use(session(sessionConfig));


process.on('warning', (warning) => {
    console.log(warning.stack);
});

// init DB
const db = require('./src/configs/mongoose/config');

// init route
app.use('/', require('./src/router'));
app.use('/v1/api/', require('./src/router/api'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// handle error
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    const statusCode = error.status | 500;
    res.locals.message = error.message || "Internal Server Error";
    res.locals.error = req.app.get("env") === "development" ? error : {};

    // render the error page
    res.status(statusCode);
    return res.render("error");
    // return res.status(statusCode).json({
    //     status: 'error',
    //     code: statusCode,
    //     message: error.message || "Internal Server Error"
    // });
});


const post = process.env.PORT || 3000;
server.listen(post, (req, res) => {
    console.log("connect to port " + post);
});
module.exports = server;


