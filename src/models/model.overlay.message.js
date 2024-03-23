const mongoose = require('mongoose');

const overlayMessageSchema = mongoose.Schema(
    {
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true, },
        status: { type: Number, required: true },
        notification: { type: String, required: true },
        colors_gradient: [{
            type: String
        }],
        image: { type: String, required: true },
        title_image: { type: String, required: true },
        content_image: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        text_action: { type: String, required: true },
        color_action: { type: String, required: false },
        action: { type: String, required: false },
        created_at: { type: String, required: true },
    },
    {
        collection: "OverlayMessages",
    }
);
const overlayMessageModel = mongoose.model("overlaymessages", overlayMessageSchema);
module.exports = { overlayMessageModel };
