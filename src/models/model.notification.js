const mongoose = require('mongoose');

const { STATUS_NOTIFICATION } = require('../utils/notification');

const notificationSchema = mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
    title: { type: String, required: true },
    content: { type: String, required: false },
    status: { type: Number, required: true, default: STATUS_NOTIFICATION.DEFAULT.value },
    image: { type: String, required: false },
    created_at: { type: String, required: true },
}, {
    collection: "Notifications"
});
const notificationModel = mongoose.model("notifications", notificationSchema);
module.exports = { notificationModel };
