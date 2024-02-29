const mongoose = require('mongoose');
const { STATUS_PRODUCT } = require('../utils/product');

const productSchema = mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "categories", required: true },
    name: { type: String, required: true },
    ram: { type: String, required: false },
    rom: { type: String, required: false },
    color: { type: String, required: false },
    quantity: { type: String, required: true },
    price: { type: String, required: true },
    description: { type: String, required: true },
    sold: { type: String, required: false, default: "0" },
    img_cover: { type: String, required: true },
    video: { type: String, required: true },
    status: { type: Number, required: true, default: STATUS_PRODUCT.STOCKING.value },
    color_code: { type: String, required: true },
    created_at: { type: String, required: true },
}, {
    collection: "Products"
});
const productModel = mongoose.model("products", productSchema);
module.exports = { productModel };