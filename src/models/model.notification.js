const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
    title: { type: String, required: true },
    content: { type: String, required: false },
    image: { type: String, required: false },
    created_at: { type: String, required: true },
}, {
    collection: "Notifications"
});
const notificationModel = mongoose.model("notifications", notificationSchema);
module.exports = { notificationModel };
