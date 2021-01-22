const mongoose = require('mongoose')

const AuthTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    token: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        default: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
    },
}, {
    timestamps: true
})

const AuthTokenModel = mongoose.model("AuthToken", AuthTokenSchema)

module.exports = AuthTokenModel