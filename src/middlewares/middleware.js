require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const MessageResponses = require('../models/model.message.response');

exports.checkPermission = (req, res, next) => {
    let date = new Date();
    let timestamp = moment(date).tz(specificTimeZone).format(formatType);
    const token = req.header('Authorization');

    let messageResponse = new MessageResponses();
    const id = uuidv4();
    messageResponse.setId(id);
    messageResponse.setStatusCode(400);
    messageResponse.setCreatedAt(timestamp);

    if (!token) {
        messageResponse.setContent("wrong token");
        // console.log(JSON.stringify(messageResponse.toJSON()));
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 400,
            code: "auth/wrong-token",
            timestamp
        });
    }
    try {
        let data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log(data);
        if (data) {
            next();
        }
    } catch (e) {
        console.log("middleware: ", e.message.toString());
        messageResponse.setContent(e.message.toString());
        // console.log(JSON.stringify(messageResponse.toJSON()));
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 400,
            code: "auth/wrong-token",
            timestamp
        });
    }
}
