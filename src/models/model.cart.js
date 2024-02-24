const mongoose = require('mongoose');

const productCartSchema = mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true, },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true, },
    quantity: { type: String, required: true },
    status: { type: Number, required: true },
    note: { type: String, required: true },
    created_at: { type: String, required: true },
  },
  {
    collection: "Carts",
  }
);
const productCartModel = mongoose.model("carts", productCartSchema);
module.exports = { productCartModel };
