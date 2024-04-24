const { Server } = require('socket.io');
const { TYPE_NOTIFICATION } = require('../utils/notification');
const { UserModel, CustomerModel, ConversationModel } = require('../models');
const NotificationService = require('../services/notification');


const initializeSocket = (server) => {
    const io = new Server(server, {
        // Socket.IO options
    });

    io.on("connection", (socket) => {
        console.log(`connect ${socket.id}`);

        socket.on("disconnect", (reason) => {
            console.log(`disconnect ${socket.id} due to ${reason}`);
        });

        // New message
        socket.on('on-chat', async data => {
            const { conversation_id, sender_id, message_type, message, created_at } = data;
            let conversation = await ConversationModel.conversationModel.findById(conversation_id).lean();
            let dataUserSend = await UserModel.userModel.findOne({
                user_id: sender_id
            }).lean();
            let dataMemberID = conversation.member_id;
            let dataMember = [];
            let dataUserFocus = {};
            await Promise.all(
                dataMemberID.map(async (id) => {
                    let filter = {
                        user_id: id
                    }
                    let member = await UserModel.userModel.findOne(filter).lean();
                    dataMember.push(member);
                    if (!id.equals(sender_id)) {
                        dataUserFocus = member;
                    }
                })
            );
            if (dataUserFocus.fcm !== undefined) {
                NotificationService.createNotificationMessage(dataUserSend.full_name, message, dataUserFocus.fcm, TYPE_NOTIFICATION.MESSAGE.value);
            }
            io.emit("user-chat", data);
        });
        //
        socket.on('on-update-chat', data => {
            const { message, type } = JSON.parse(data);
            console.log(type);
        });
        socket.on('user-chat', data => {
            console.log(data);
        });

    });
}

module.exports = {
    initializeSocket
};
