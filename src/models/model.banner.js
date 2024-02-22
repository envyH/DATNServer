const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema(
    {
        creator_id: { type: String, required: true },
        url: { type: String, required: true },
        created_time: { type: String, required: true },
    },
    {
        collection: "Banners",
    }
);
const bannerModel = mongoose.model("banners", bannerSchema);
module.exports = { bannerModel };
