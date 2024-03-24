const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { BannerModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class GlobalService {

    ping = async (req, res) => {

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        messageResponse.setStatusCode(200);
        messageResponse.setCode("global/server-starting");
        messageResponse.setContent("Server is starting...");

        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 200,
            code: "global/server-starting",
            timestamp
        });
    }

}

module.exports = new GlobalService;