const mongoose = require('mongoose');

const { STATUS_CUSTOMER } = require('../utils/customer');
const avatarDefault = "https://stech-993p.onrender.com/images/logo.jpeg";

const customerSchema = mongoose.Schema(
    {
        avatar: { type: String, default: avatarDefault },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        full_name: { type: String, required: false },
        phone_number: { type: String, required: true, unique: true },
        status: { type: Number, required: true, default: STATUS_CUSTOMER.NOT_VERIFIED.value },
        otp: { type: String, required: false},
        fcm: { type: String, required: false },
        new_pass: { type: String, required: false },
        link_reset_pass: { type: String, required: false },
        created_at: { type: String, required: true },
    },
    {
        collection: "Customers",
    }
);
const customerModel = mongoose.model("customers", customerSchema);
module.exports = { customerModel };
