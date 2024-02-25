require("dotenv").config();
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";


exports.checkPermission = (req, res, next) => {
    let date = new Date();
    let timestamp = moment(date).tz(specificTimeZone).format(formatType);
    const token = req.header('Authorization');
    if (!token) {
        return res.send({
            message: "wrong token",
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
        console.log("middleware: ", e.message.toString(),);
        return res.send({
            message: "wrong token",
            statusCode: 400,
            code: "auth/wrong-token",
            timestamp
        });
    }
}
