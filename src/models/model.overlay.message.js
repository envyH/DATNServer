const mongoose = require('mongoose');

const overlayMessageSchema = mongoose.Schema(
    {
        notification: { type: String, required: true },
        image: { type: String, required: true },
        title_image: { type: String, required: true },
        content_image: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        text_action: { type: String, required: true },
        action: { type: String, required: false },
        created_at: { type: String, required: true },
    },
    {
        collection: "OverlayMessages",
    }
);
const overlayMessageModel = mongoose.model("overlaymessages", overlayMessageSchema);
module.exports = { overlayMessageModel };
