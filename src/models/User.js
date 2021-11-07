const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const ConfirmationTokenModel = require('./ConfirmationToken')
const PasswordResetTokenModel = require('./PasswordResetToken')
const AuthTokenModel = require('./AuthToken')
const CategoryModel = require('./Category')
const TaskModel = require('./Task')

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
    const user = this

    if (!user.isModified('password')) return next()

    bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT, 10), function (err, hash) {
        if (err) throw err

        user.password = hash
        next()
    });
});

UserSchema.post('deleteOne', {document: true, query: false}, function () {
    const user = this

    Promise.all([
        ConfirmationTokenModel.deleteOne({user: mongoose.Types.ObjectId(user._id)}),
        PasswordResetTokenModel.deleteOne({user: mongoose.Types.ObjectId(user._id)}),
        AuthTokenModel.deleteMany({user: mongoose.Types.ObjectId(user._id)}),
        CategoryModel.deleteMany({user: mongoose.Types.ObjectId(user._id)}),
        TaskModel.deleteMany({user: mongoose.Types.ObjectId(user._id)})
    ])
        .then(() => {
            console.log("User and all connected documents was deleted")
        })
        .catch(() => {
            throw new Error("Unable to delete connected documents")
        })
})

UserSchema.methods.generateConfirmationToken = function (callback) {
    const user = this;

    ConfirmationTokenModel.findOne({userId: user._id}, function (err, token) {
        if (token) {
            return callback(null, token.token)
        } else {
            bcrypt.hash(user.email + new Date().toString(), parseInt(process.env.BCRYPT_SALT, 10), function (err, generatedToken) {
                if (err) {
                    return callback(err, null)
                }

                let confirmationToken = ConfirmationTokenModel({
                    user: user._id,
                    token: generatedToken
                });

                confirmationToken.save(function (err, tokenDoc) {
                    if (err) {
                        return callback(err, null)
                    }

                    user.confirmationToken = mongoose.Types.ObjectId(tokenDoc._id);
                    user.save()

                    return callback(null, tokenDoc.token)
                });
            });
        }
    });
}

UserSchema.methods.generateAuthToken = function (callback) {
    let user = this;

    let token = jwt.sign({
        _id: user._id,
        name: user.name,
        email: user.email
    }, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGORITHM
    });

    let authToken = new AuthTokenModel({
        user: mongoose.Types.ObjectId(user._id),
        token: token
    })

    authToken.save((err, tokenDoc) => {
        if (err) {
            return callback(err, null)
        }

        user.authTokens.push(mongoose.Types.ObjectId(tokenDoc._id))

        user.save((err) => {
            if (err) {
                return callback(err, null)
            } else {
                return callback(null, tokenDoc.token)
            }
        })
    });
}

UserSchema.methods.updateAuthToken = function (authToken) {
    AuthTokenModel.findOneAndUpdate(
        {token: authToken},
        {expireAt: new Date()},
        function (err) {
            if (err) {
                throw err
            }
        });
}

UserSchema.methods.deleteAuthToken = function (authToken, callback) {
    AuthTokenModel.findOne({token: authToken}, (err, token) => {
        if (err) {
            return callback(err, null)
        } else {
            token.deleteOne(() => {
                this.authTokens.filter(token => {
                    return token !== token._id
                })
                this.save()

                return callback(null, token.token)
            });
        }
    });
}

UserSchema.statics.findByCredentials = function (email, password, callback) {
    UserModel.findOne({email: email}, (err, user) => {
        if (!user || err) {
            return callback(new Error("Invalid login credentials"), user)
        }

        let isPasswordMatch = bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return callback(new Error("Invalid login credentials"), user)
        }

        return callback(null, user)
    });
}

UserSchema.methods.generatePasswordResetToken = function (callback) {
    let user = this

    bcrypt.hash(user.password + new Date().toString(), process.env.BCRYPT_SALT, function (err, token) {
        if (err) {
            return callback(err, null)
        }

        let passwordResetToken = new PasswordResetTokenModel({
            user: mongoose.Types.ObjectId(user._id),
            token: token
        });

        passwordResetToken.save(function (err, tokenDoc) {
            if (err) {
                return callback(err, null)
            }

            user.passwordResetToken = mongoose.Types.ObjectId(tokenDoc._id)
            user.save((err) => {
                if (err) {
                    return callback(err, null)
                } else {
                    return callback(null, tokenDoc.token)
                }
            })
        })
    })
}

UserSchema.methods.cleanSensitive = function () {
    let user = this.toObject()
    const sensitiveFields = ['password', 'confirmationToken', 'authTokens', 'passwordResetToken']

    sensitiveFields.forEach(fieldName => {
        delete user[fieldName]
    })

    return user
}

UserSchema.methods.getTasks = function (callback) {
    let user = this
    return user.populate('tasksList').execPopulate()
        .then(user => {
            callback(null, user.tasksList)
        })
        .catch(err => {
            callback(err, null)
        })
}

UserSchema.methods.getCategories = function (callback) {
    let user = this
    user.populate('categoriesList').execPopulate()
        .then(user => {
            callback(null, user.categoriesList)
        })
        .catch(err => {
            callback(err, null)
        })
}

UserSchema.methods.populateDocWithTasksAndCategories = function (callback) {
    let user = this
    user.populate('tasksList', 'categoriesList').execPopulate()
        .then(user => {
            callback(null, user)
        })
        .catch(err => {
            callback(err, null)
        })
}

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel