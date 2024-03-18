const mongoose = require('mongoose');

const authTokenSchema = mongoose.Schema(
    {
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
        token: { type: String, required: true },
        created_at: { type: String, required: true },
    },
    {
        collection: "AuthTokens",
    }
);
const authTokenModel = mongoose.model("authtokens", authTokenSchema);
module.exports = { authTokenModel };
