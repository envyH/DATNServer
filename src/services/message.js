const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { ConversationModel, MessageModel } = require('../models');
const { encryptedMessage, checkTypeMessage, TYPE_MESSAGE } = require('../utils/message');
const MessageResponses = require('../models/model.message.response');

const checkUserInConversation = async (conversationID, senderID) => {
    const filter = {
        _id: conversationID,
        member_id: { $in: [senderID] },
    }
    try {
        let conversation = await ConversationModel.conversationModel.findOne(filter).lean();
        if (conversation) {
            return true;
        }
        return false;
    } catch (e) {
        console.log("===========checkUserInConversation=============");
        console.log(e.message);
        return false;
    }
}

const saveMessage = async (res, messageResponse, message, conversationID, senderID, messageType, timestamp) => {
    try {
        let newMessage = new MessageModel.messageModel({
            conversation_id: conversationID,
            sender_id: senderID,
            message_type: messageType,
            message: message,
            created_at: timestamp,
        });
        await newMessage.save();
        messageResponse.setStatusCode(200);
        messageResponse.setCode("message/create-success");
        messageResponse.setContent("Create message success!");
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 200,
            code: "message/create-success",
            timestamp
        });
    } catch (e) {
        console.log("========saveMessage=========");
        console.log(e.message.toString());
        messageResponse.setStatusCode(400);
        messageResponse.setCode("message/create-failed");
        messageResponse.setContent(e.message.toString());
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 400,
            code: "message/create-failed",
            timestamp
        });
    }
}
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

        let flag = await checkUserInConversation(conversationID, senderID);
        if (!flag) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("message/user-not-in-conversation");
            messageResponse.setContent("You do not have permission to send messages!");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "message/user-not-in-conversation",
                timestamp
            });
        }
        switch (messageType) {
            case TYPE_MESSAGE.TEXT.value:
                const encryptedMsg = await encryptedMessage(message);
                await saveMessage(res, messageResponse, encryptedMsg, conversationID, senderID, TYPE_MESSAGE.TEXT.value, timestamp)
                break;
            case TYPE_MESSAGE.IMAGE.value:
                return res.send("Send image updating....")
                break;
            case TYPE_MESSAGE.VIDEO.value:
                return res.send("Send video updating....")
                break;
            case TYPE_MESSAGE.FILE.value:
                return res.send("Send file updating....")
                break;
            default:
                return res.send("Updating....")
                break;
        }
    }

}

module.exports = new MessageService;