const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    created_time: { type: String, required: true },
  },
  {
    collection: "Categories",
  }
);
const categoryModel = mongoose.model("categories", categorySchema);
module.exports = { categoryModel };
