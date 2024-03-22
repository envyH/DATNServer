const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('./firebase');

const { OverlayMessagesModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class OverlayMessageService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("overlay/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "overlay/missing-customerid", timestamp });
        }

        try {
            let overlayMessage = await OverlayMessagesModel.overlayMessageModel.find().lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("overlay/get-success");
            messageResponse.setContent("get list overlay message success");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "overlay/get-success",
                overlayMessages: overlayMessage,
                timestamp
            });
        } catch (e) {
            console.log("=========getList==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("overlay/get-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "overlay/get-failed",
                timestamp
            });
        }
    }

}

module.exports = new OverlayMessageService;