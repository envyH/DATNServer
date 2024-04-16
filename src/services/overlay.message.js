const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('./firebase');

const { OverlayMessagesModel } = require('../models');
const MessageResponses = require('../models/model.message.response');

const { STATUS_OVERLAY_MESSAGE, checkStatusOverlayMessage } = require('../utils/overlay.message');


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
            const filter = {
                customer_id: customerID,
                status: STATUS_OVERLAY_MESSAGE.DEFAULT.value
            };
            let overlayMessage = await OverlayMessagesModel.overlayMessageModel.find(filter).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("overlay/get-success");
            messageResponse.setContent("Get list overlay message success.");
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

    updateStatus = async (req, res) => {
        const customerID = req.body.customerID;
        const overlayMessageID = req.body.overlayMessageID;
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
        if (overlayMessageID === undefined || overlayMessageID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("overlay/missing-overlaymessageid");
            messageResponse.setContent("Missing overlayMessageID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "overlay/missing-overlaymessageid", timestamp });
        }

        try {
            const filter = {
                _id: overlayMessageID,
                status: STATUS_OVERLAY_MESSAGE.DEFAULT.value
            }
            const update = { status: STATUS_OVERLAY_MESSAGE.SEEN.value };
            await OverlayMessagesModel.overlayMessageModel.findOneAndUpdate(filter, update).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("overlay/update-status-success");
            messageResponse.setContent("Update status overlay message success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "overlay/update-status-success",
                timestamp
            });
        } catch (e) {
            console.log("=========updateStatus==========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("overlay/update-status-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "overlay/update-status-failed",
                timestamp
            });
        }
    }

}

module.exports = new OverlayMessageService;