const mongoose = require("mongoose");

const { } = require('../models/');
const { parseCookies } = require('../helpers/cookie');
const { decryptedMessage } = require('../utils/message');
const { UserModel, ConversationModel, MessageModel } = require('../models');


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

const getLatestMessage = async (conversationID, memberID) => {
    const filter = {
        conversation_id: conversationID
    }
    const options = {
        sort: { created_at: -1 }, // Sắp xếp theo created_at giảm dần để lấy tin nhắn mới nhất đầu tiên
        limit: 1
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

const checkUserInConversation = async (conversationID, userID) => {
    const filter = {
        _id: conversationID,
        member_id: { $in: [userID] },
    };
    try {
        let conversation = await ConversationModel.conversationModel
            .findOne(filter)
            .lean();
        if (conversation) {
            return true;
        }
        return false;
    } catch (e) {
        console.log("===========checkUserInConversation=============");
        console.log(e.message);
        return false;
    }
};

const getDataUserFocus = async (members, userIDLogged) => {
    let data = {};
    members.map((member) => {
        if (!member.user_id.equals(userIDLogged)) {
            data = member;
        }
    });
    return data;
}

const getDataConversation = async (memberID) => {
    const filter = {
        member_id: { $in: [memberID] },
    }
    try {
        let dataRawConversation = await ConversationModel.conversationModel.find(filter).lean();
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
        );
        return dataConversation;
    } catch (e) {
        console.log(`getDataConversation: ${e.message}`);
        return [];
    }
}


class ChatController {

    checkConversationID = async (req, res) => {
        const conversationID = req.body.conversationID;
        const userLoggedID = req.body.userLoggedID;

        if (conversationID === undefined || conversationID.length === 0) {
            return res.send({
                message: "conversationID required",
                statusCode: 400,
                code: "message/conversationid-required"
            });
        }
        if (userLoggedID === undefined || userLoggedID.length === 0) {
            return res.send({
                message: "userLoggedID required",
                statusCode: 400,
                code: "message/userLoggedID-required"
            });
        }

        try {
            let flag = await checkUserInConversation(conversationID, userLoggedID);
            if (flag) {
                return res.send({
                    message: "OKE",
                    statusCode: 200,
                    conversationID: conversationID,
                    code: "message/oke"
                });
            }
            return res.send({
                message: "Not permission",
                statusCode: 400,
                code: "message/not-permission"
            });
        } catch (e) {

        }
    }

    showMessage = async (req, res) => {
        const cookies = parseCookies(req);
        if (cookies.dataUserLogged === undefined) {
            return res.redirect('/login')
        }
        try {
            const dataUserLogged = JSON.parse(atob(cookies.dataUserLogged));
            const { _id, avatar, email, full_name, phone_number } = dataUserLogged;
            let dataConversation = await getDataConversation(_id);
            let conversationID = req.params.conversationid;
            if (conversationID === undefined) {
                return res.send({
                    message: "Error load data conversationID",
                    statusCode: 400,
                    code: "message/error-load-conversationid"
                });
            }
            let isOpenLayotMsg = false;
            let dataMessageResponse = [];
            if (conversationID != undefined) {
                conversationID = atob(conversationID);
                console.log(conversationID);
                let flag = await checkUserInConversation(conversationID, _id);
                if (flag) {
                    const filter = {
                        conversation_id: conversationID,
                    };
                    let dataRawMessage = await MessageModel.messageModel.find(filter).lean();
                    await Promise.all(
                        dataRawMessage.map(async (dataMsg) => {
                            let msg = await decryptedMessage(dataMsg.message);
                            // TODO optimize
                            let dataMessage = {
                                _id: dataMsg._id,
                                conversation_id: dataMsg.conversation_id,
                                sender_id: dataMsg.sender_id,
                                message_type: dataMsg.message_type,
                                message: msg,
                                status: dataMsg.status,
                                created_at: dataMsg.created_at,
                            };
                            dataMessageResponse.push(dataMessage);
                        })
                    );
                    isOpenLayotMsg = true;
                }
            }

            let dataMember = [];
            if (isOpenLayotMsg) {
                let dataConversation = await ConversationModel.conversationModel.findById(conversationID).lean();
                await Promise.all(
                    dataConversation.member_id.map(async (id) => {
                        let member = await getDataUser(id);
                        dataMember.push(member);
                    })
                )
            }
            let dataUserFocus = await getDataUserFocus(dataMember, _id);
            return res.render('conversation', {
                layout: "conversation",
                userLoged: dataUserLogged,
                idConversation: dataMessageResponse.length > 0 ? dataMessageResponse[0].conversation_id : null,
                conversations: dataConversation,
                isOpenLayotMsg: true,
                dataHeaderMsg: dataUserFocus,
                dataMessage: dataMessageResponse
            });
        } catch (e) {
            console.log("ChatController: showMessage: ", e.message);
            return res.render('conversation', {
                layout: "conversation",
                userLoged: {},
                conversations: [],
                isOpenLayotMsg: false,
                dataHeaderMsg: {},
                dataMessage: []
            });
        }

    }
    showConversation = async (req, res) => {
        const cookies = parseCookies(req);
        if (cookies.dataUserLogged === undefined) {
            return res.redirect('/login')
        }

        try {
            const dataUserLogged = JSON.parse(atob(cookies.dataUserLogged));
            const { _id, avatar, email, full_name, phone_number } = dataUserLogged;
            let dataConversation = await getDataConversation(_id);
            return res.render('conversation', {
                layout: "conversation",
                userLoged: dataUserLogged,
                conversations: dataConversation,
                isOpenLayotMsg: false,
                dataHeaderMsg: {},
                dataMessage: []
            });
        } catch (e) {
            console.log("ChatController: showConversation: ", e.message);
            return res.render('conversation', {
                layout: "conversation",
                userLoged: {},
                conversations: [],
                isOpenLayotMsg: false,
                dataHeaderMsg: {},
                dataMessage: []
            });
        }

    }

    edit = (req, res, next) => {
        console.log(req);
        return res.send({
            message: "OKE",
            code: 1
        })
    }
    update = (req, res, next) => {

    }

    destroy(req, res, next) {

    }

    showAll = (req, res) => {

    }

}

module.exports = new ChatController;