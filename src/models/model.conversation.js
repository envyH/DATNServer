const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        creator_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        member_id: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "users",
                required: true
            },
        ],
        created_at: { type: String, required: true },
        updated_at: { type: String, required: false },
        deleted_at: { type: String, required: false },
    },
    {
        collection: "Conversations",
    }
);
const conversationModel = mongoose.model("conversations", conversationSchema);
module.exports = { conversationModel };
