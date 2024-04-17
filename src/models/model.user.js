const mongoose = require('mongoose');


const userSchema = mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
        email: { type: String, required: false, unique: true },
        avatar: { type: String, required: false },
        full_name: { type: String, required: false },
        phone_number: { type: String, required: false, unique: true },
        created_at: { type: String, required: true },
    },
    {
        collection: "Users",
    }
);
const userModel = mongoose.model("users", userSchema);
module.exports = { userModel };
