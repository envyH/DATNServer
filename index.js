require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const compression = require('compression');
const { default: helmet } = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    // Socket.IO options
});

// firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require('./src/configs/firebase/config.json');
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// view engine setup
app.set("views", path.join(__dirname, "/src/views"));
app.set("view engine", "pug");

app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


process.on('warning', (warning) => {
    console.log(warning.stack);
});

// init DB
const db = require('./src/configs/mongoose/config');

// init route
app.use('/', require('./src/router'));

// handle error
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    const statusCode = error.status | 500;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || "Internal Server Error"
    });
});


const post = process.env.PORT || 3000;
server.listen(post, (req, res) => {
    console.log("connect to port " + post);
});
module.exports = server;


