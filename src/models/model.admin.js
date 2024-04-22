const mongoose = require('mongoose');
const avatarDefault = "https://stech-993p.onrender.com/images/logo.jpeg";

const adminSchema = mongoose.Schema(
    {
        avatar: { type: String, default: avatarDefault },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        full_name: { type: String, required: false },
        phone_number: { type: String, required: true, unique: true },
        otp: { type: String, required: false },
        fcm: { type: String, required: false },
        created_at: { type: String, required: true },
    },
    {
        collection: "Admins",
    }
);
const adminModel = mongoose.model("admins", adminSchema);
module.exports = { adminModel };
