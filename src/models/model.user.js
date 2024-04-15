const mongoose = require('mongoose');


const userSchema = mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        created_at: { type: String, required: true },
    },
    {
        collection: "Users",
    }
);
const userModel = mongoose.model("users", userSchema);
module.exports = { userModel };
