const mongoose = require('mongoose');
const { STATUS_ORDER } = require('../utils/order');
const { PAYMENT_METHOD } = require('../utils/payment');

const orderSchema = mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: false },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "employees", required: false, default: null },
    delivery_address_id: { type: mongoose.Schema.Types.ObjectId, ref: "delivery_address", required: false },
    status: { type: Number, required: true, default: STATUS_ORDER.WAITCONFIRM.value },
    amount: { type: String, required: true },
    payment_method: { type: Number, required: true, default: PAYMENT_METHOD.DELIVERY.value },
    created_at: { type: String, required: true },
    guest_name: { type: String, required: false },
    guest_phoneNumber: { type: String, required: false },
    guest_address: { type: String, required: false },
}, {
    collection: "Orders"
});
const orderModel = mongoose.model("orders", orderSchema);
module.exports = { orderModel };
