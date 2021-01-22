const mongoose = require('mongoose')

const ConfirmationTokenSchema = new mongoose.Schema({
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
        default: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
}, {
    timestamps: true
})

const ConfirmationTokenModel = mongoose.model("ConfirmationToken", ConfirmationTokenSchema)

module.exports = ConfirmationTokenModel