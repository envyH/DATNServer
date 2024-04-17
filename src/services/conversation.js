const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { UserModel, ConversationModel, MessageModel } = require('../models');
const MessageResponses = require('../models/model.message.response');
const { isNumber } = require('../utils');
const { decryptedMessage } = require('../utils/message');



const isConversationExist = async (creatorID, members) => {
    const filter = {
        creator_id: creatorID,
        member_id: {
            $all: members,
            $size: members.length
        }
    }
    try {
        let dataConversation = await ConversationModel.conversationModel.findOne(filter).lean();
        if (dataConversation) {
            return true;
        }
        return false;
    } catch (e) {
        console.log("===========isConversationExist=============");
        console.log(e.message);
        return true;
    }
}

const getLatestMessage = async (conversationID, memberID) => {
    const filter = {
        conversation_id: conversationID
    }
    const options = {
        sort: { created_at: -1 }, // Sắp xếp theo created_at giảm dần để lấy tin nhắn mới nhất đầu tiên
        limit: 1 // Giới hạn kết quả trả về chỉ là 1 tin nhắn
    };
    try {
        let dataMessageLatest = await MessageModel.messageModel.findOne(filter, null, options).lean();
        return dataMessageLatest

    } catch (e) {
        console.log("===========getLatestMessage=============");
        console.log(e.message);
        return null;
    }
}

const getDataUser = async (userID) => {
    const filter = {
        user_id: userID
    }
    try {
        let dataUser = await UserModel.userModel.findOne(filter).lean();
        return dataUser;
    } catch (e) {
        console.log("===========getDataUser=============");
        console.log(e.message);
        return null;
    }

}


class ConversationService {
    create = async (req, res) => {
        const title = req.body.title;
        const creatorID = req.body.creator_id;
        const member = req.body.member;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4(undefined, undefined, undefined);
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);


        if (title === undefined || title.toString().trim().length === 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/missing-title");
            messageResponse.setContent("Missing title");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/missing-title",
                timestamp
            });
        }

        if (creatorID === undefined || creatorID.toString().trim().length === 0
            // || isNumber(creatorID)
            || !mongoose.isValidObjectId(creatorID)) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/missing-creator-id");
            messageResponse.setContent("Missing creator_id");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/missing-creator-id",
                timestamp
            });
        }

        if (member === undefined || member.length === 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/missing-member");
            messageResponse.setContent("Missing member");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/missing-channel-id",
                timestamp
            });
        }
        if (member.length === 1) {
            if (member[0] === creatorID) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("conversation/member >= 2");
                messageResponse.setContent("Member >=2");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "conversation/member >= 2",
                    timestamp
                });
            }
        }

        // create conversation
        try {
            let arrMember = [creatorID, ...member];
            arrMember = [...new Set(arrMember)];
            let flag = await isConversationExist(creatorID, arrMember);
            if (flag) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("conversation/create-failed-exist");
                messageResponse.setContent("Conversation exist create failed!");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: "conversation/create-failed-exist",
                    timestamp
                });
            }
            let conversation = new ConversationModel.conversationModel({
                title: title,
                creator_id: creatorID,
                member_id: arrMember,
                created_at: timestamp,
            });
            await conversation.save();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("conversation/create-success");
            messageResponse.setContent("Create conversation success!");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "conversation/create-success",
                timestamp
            });
        } catch (e) {
            console.log("========create=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/create-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/create-failed",
                timestamp
            });
        }
    }

    getList = async (req, res) => {
        const memberID = req.body.memberID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4(undefined, undefined, undefined);
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (memberID === undefined || memberID.toString().trim().length === 0
            // || isNumber(memberID)
            || !mongoose.isValidObjectId(memberID)) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/missing-member-id");
            messageResponse.setContent("Missing member_id");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/missing-member-id",
                timestamp
            });
        }

        try {
            const filter = {
                member_id: { $in: [memberID] },
            }
            let dataRawConversation = await ConversationModel.conversationModel.find(filter).lean();
            if (dataRawConversation.length === 0) {
                messageResponse.setStatusCode(200);
                messageResponse.setCode("conversation/not-conversation");
                messageResponse.setContent("There was no conversation");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "conversation/not-conversation",
                    timestamp
                });
            }
            let dataConversation = [];
            await Promise.all(
                dataRawConversation.map(async (conversation) => {
                    let conversationID = conversation._id;
                    let dataUser = [];
                    let members = conversation.member_id;
                    await Promise.all(
                        members.map(async (member) => {
                            let user = await getDataUser(member);
                            dataUser.push(user);
                        })
                    );
                    let dataLatestMsg = await getLatestMessage(conversationID, memberID);
                    let message;
                    let senderID;
                    let messageType;
                    let timestamp;
                    let status;
                    if (dataLatestMsg != null) {
                        message = await decryptedMessage(dataLatestMsg.message);
                        console.log(message);
                        senderID = dataLatestMsg.sender_id;
                        messageType = dataLatestMsg.message_type;
                        status = dataLatestMsg.status;
                        timestamp = dataLatestMsg.created_at;
                    } else {
                        message = "";
                        senderID = null;
                        messageType = null;
                        status = null;
                        timestamp = conversation.created_at;
                    }
                    let rawData = {
                        conversation_id: conversationID,
                        conversation_name: conversation.title,
                        sender_id: senderID,
                        metadata: dataUser,
                        message: message,
                        message_type: messageType,
                        status: status,
                        created_at: timestamp
                    }
                    dataConversation.push(rawData);
                })
            )
            // console.log(dataConversation);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("conversation/get-list-success");
            messageResponse.setContent("Get data conversation success!");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                conversations: dataConversation,
                code: "conversation/get-list-success",
                timestamp
            });
        } catch (e) {
            console.log("========getList=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("conversation/get-list-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "conversation/get-list-failed",
                timestamp
            });
        }

    }

}

module.exports = new ConversationService;
