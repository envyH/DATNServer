const mongoose = require('mongoose');

const avatar = "http://localhost:3000/images/logo.jpeg";
const status = "Not verified";
const customerSchema = mongoose.Schema(
    {
        avatar: { type: String, default: avatar },
        email: { type: String, required: true },
        password: { type: String, required: true },
        full_name: { type: String, required: false },
        phone_number: { type: String, required: true },
        status: { type: String, required: true, default: status },
        otp: { type: String, required: false },
        fcm: { type: String, required: false },
        new_pass: { type: String, required: false },
        link_reset_pass: { type: String, required: false },
        created_time: { type: String, required: true },
    },
    {
        collection: "Customers",
    }
);
const customerModel = mongoose.model("customers", customerSchema);
module.exports = { customerModel };