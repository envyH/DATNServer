const mongoose = require('mongoose');

const { STATUS_MESSAGE, TYPE_MESSAGE } = require('../utils/message');
const messageSchema = mongoose.Schema(
    {
        conversation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "conversations",
            required: true
        },
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        message_type: { type: Number, required: true, default: TYPE_MESSAGE.TEXT.value },
        message: { type: String, required: true },
        status: { type: Number, required: true, default: STATUS_MESSAGE.SENDING.value },
        created_at: { type: String, required: true },
        updated_at: { type: String, required: false },
        deleted_at: { type: String, required: false },
    },
    {
        collection: "Messages",
    }
);
const messageModel = mongoose.model("messages", messageSchema);
module.exports = { messageModel };
