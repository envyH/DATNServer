const mongoose = require('mongoose');
const { STATUS_ORDER } = require('../utils/order');
const { PAYMENT_METHOD } = require('../utils/payment');

const orderDetailSchema = mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
    quantity: { type: String, required: true },
    status: { type: Number, required: true, default: STATUS_ORDER.WAITCONFIRM.value },
    payment_method: { type: Number, required: true, default: PAYMENT_METHOD.DELIVERY.value }
}, {
    collection: "OrderDetails",
});

const orderDetailModel = mongoose.model("orderdetails", orderDetailSchema);
module.exports = { orderDetailModel };
