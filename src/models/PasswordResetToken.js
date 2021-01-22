const mongoose = require('mongoose')

const PasswordResetTokenSchema = new mongoose.Schema({
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

const PasswordResetTokenModel = mongoose.model("PasswordResetToken", PasswordResetTokenSchema)

module.exports = PasswordResetTokenModel