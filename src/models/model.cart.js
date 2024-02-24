const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true, },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true, },
    quantity: { type: String, required: true },
    status: { type: Number, required: true, default: 1 },
    note: { type: String, required: false },
    created_at: { type: String, required: true },
  },
  {
    collection: "Carts",
  }
);
const cartModel = mongoose.model("carts", cartSchema);
module.exports = { cartModel };
