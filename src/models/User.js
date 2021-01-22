const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const ConfirmationTokenModel = require('./ConfirmationToken')
const PasswordResetTokenModel = require('./PasswordResetTokenModel')
const AuthTokenModel = require('./AuthTokenModel')

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        validate: [validator.isEmail, "Invalid email address"],
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: [true, "Name is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirmationToken: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ConfirmationToken"
    },
    authTokens: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthToken"
    }],
    passwordResetToken: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PasswordResetToken"
    },
    tasksList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }],
    categoriesList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }]
}, {
    timestamps: true
});

UserSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT, 10), function (err, hash) {
        if (err) throw err;

        user.password = hash;
        next();
    });
});

UserSchema.methods.generateConfirmationToken = function () {
    const user = this;

    ConfirmationTokenModel.findOne({userId: mongoose.Types.ObjectId(user._id)}, function (err, token) {
        if (token) {
            return token;
        } else {
            bcrypt.hash(user.email + new Date().toString(), parseInt(process.env.BCRYPT_SALT, 10), function (err, token) {
                if (err) throw err

                let confirmationToken = ConfirmationTokenModel({
                    user: mongoose.Types.ObjectId(user._id),
                    token: token
                });

                confirmationToken.save(function (err, token) {
                    if (err) throw err

                    user.confirmationToken = mongoose.Types.ObjectId(token._id);

                    return token
                });
            });
        }
    });
}

UserSchema.methods.generateAuthToken = function () {
    let user = this;

    let token = jwt.sign({
        name: user.name,
        email: user.email
    }, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGORITHM
    });

    let authToken = new AuthTokenModel({
        user: mongoose.Types.ObjectId(user._id),
        token: token
    })

    authToken.save(function (err, token) {
        if (err) throw err

        user.authTokens.push(mongoose.Types.ObjectId(token._id))

        return token
    });
}

UserSchema.methods.updateAuthToken = function (authToken) {
    AuthTokenModel.find({token: authToken}, function (err, token) {
        token.expireAt = new Date();

        return token;
    });
}

UserSchema.statics.findByCredentials = function (email, password) {
    UserModel.findOne({email: email}, (err, user) => {
        if (!user) throw new Error("Invalid login credentials");

        let isPasswordMatch = bcrypt.compare(password, user.password);

        if (!isPasswordMatch) throw new Error("Invalid login credentials");

        return user
    });
}

UserSchema.methods.generatePasswordResetToken = function () {
    let user = this;

    bcrypt.hash(user.password + new Date().toString(), process.env.BCRYPT_SALT, function (err, token) {
        if (err) throw err

        let passwordResetToken = new PasswordResetTokenModel({
            user: mongoose.Types.ObjectId(user._id),
            token: token
        });

        passwordResetToken.save(function (err, token) {
            if (err) throw err

            user.passwordResetToken = mongoose.Types.ObjectId(token._id)

            return token
        });
    });
}

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel