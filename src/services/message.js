const {v4: uuidv4} = require('uuid');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const {} = require('../models');
const {encryptedMessage, checkTypeMessage, TYPE_MESSAGE} = require('../utils/message');
const MessageResponses = require('../models/model.message.response');


class MessageService {
    addMessage = async (req, res) => {
        const conversationID = req.body.conversation_id;
        const senderID = req.body.sender_id;
        const message = req.body.message;
        const messageType = req.body.message_type;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4(undefined, undefined, undefined);
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);


        if (conversationID === undefined || conversationID.toString().trim().length === 0 || !mongoose.isValidObjectId(conversationID)) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("message/missing-conversation-id");
            messageResponse.setContent("Missing conversation_id");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "message/missing-conversation-id",
                timestamp
            });
        }

        if (senderID === undefined || senderID.toString().trim().length === 0 || !mongoose.isValidObjectId(senderID)) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("message/missing-sender-id");
            messageResponse.setContent("Missing sender_id");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "message/missing-sender-id",
                timestamp
            });
        }

        let isValidType = checkTypeMessage(messageType);
        if (!isValidType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("message/type-not-valid");
            messageResponse.setContent("Message type is not valid");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "message/type-not-valid",
                timestamp
            });

        }
        switch (messageType) {
            case TYPE_MESSAGE.TEXT.value:
                const newMessage = await encryptedMessage(message);
                return res.send(newMessage)
            case TYPE_MESSAGE.IMAGE.value:
                return res.send("Send image updating....")
            case TYPE_MESSAGE.VIDEO.value:
                return res.send("Send video updating....")
            case TYPE_MESSAGE.FILE.value:
                return res.send("Send file updating....")
            default:
                return res.send("Updating....")
        }
    }

}

module.exports = new MessageService;