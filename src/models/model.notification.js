const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: false },
    image: { type: String, required: false },
    created_at: { type: String, required: false },
}, {
    collection: "Notifications"
});
const notificationModel = mongoose.model("notifications", notificationSchema);
module.exports = { notificationModel };