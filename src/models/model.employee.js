const mongoose = require('mongoose');
const avatarDefault = "https://stech-993p.onrender.com/images/logo.jpeg";
const { STATUS_CUSTOMER } = require('../utils/customer');

const employeeSchema = mongoose.Schema(
    {
        avatar: { type: String, default: avatarDefault },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        full_name: { type: String, required: false },
        phone_number: { type: String, required: true, unique: true },
        status: { type: Number, required: true, default: STATUS_CUSTOMER.NOT_VERIFIED.value },
        otp: { type: String, required: false },
        fcm: { type: String, required: false },
        created_at: { type: String, required: true },
    },
    {
        collection: "Employees",
    }
);
const employeeModel = mongoose.model("employees", employeeSchema);
module.exports = { employeeModel };
