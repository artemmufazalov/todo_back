const mongoose = require('mongoose');

const validate = require('../utils/validators/validate');
const {createConfirmationEmail, createPasswordResetEmail} = require('../utils/nodemailerEmailTemplates/emails');
const mailer = require('../core/nodemailer');
const UserModel = require('../models/User');
const ConfirmationTokenModel = require('../models/ConfirmationToken');

class UserController {

    create = function (req, res) {
        const postData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
        };

        UserModel.findOne({email: postData.email}, {}, {}, (err, user) => {
            if (user) {
                return res.status(401)
                    .json({
                        message: "User with this email already exist",
                        resultCode: 1
                    });
            } else if (err) {
                return res.status(500)
                    .json({
                        message: "Some error occurred",
                        error: err,
                        resultCode: 1
                    });
            } else {
                let errors = validate(postData);
                if (errors.email || errors.password || errors.name) {
                    return res.status(401)
                        .json({
                            message: "Values didn't pass the validation",
                            errors: errors,
                            resultCode: 1
                        })
                } else {
                    const user = new UserModel(postData);

                    user.save()
                        .then((user) => {
                            let confirmationToken = user.generateConfirmationToken()

                            mailer.sendMail(createConfirmationEmail(process.env.NODEMAILER_USER, postData.email, user.username, confirmationToken),
                                (err, info) => {
                                    if (err) {
                                        UserModel.findById(user._id, {}, {}, (err, user) => {
                                            user.deleteOne({}, () => {
                                                return res.status(500).json({
                                                    message: "Some server error, registration could not be completed",
                                                    resultCode: 1
                                                });
                                            });
                                        })
                                    } else {
                                        return res.status(200).json({
                                            message: "User created successfully",
                                            nextMessage: "Email confirmation is required",
                                            user: {
                                                ...user._doc,
                                                _id: "",
                                                password: "",
                                                confirmationToken: "",
                                                authTokens: "",
                                                passwordResetToken: "",
                                                tasksList: "",
                                                categoriesList: ""
                                            },
                                            resultCode: 0
                                        });
                                    }
                                }
                            );
                        })
                        .catch((err) => {
                            return res.status(500)
                                .json({
                                    message: "Some error occurred",
                                    error: err,
                                    resultCode: 1
                                });
                        });
                }
            }
        })
    }

    delete = function (req, res) {
        const id = req.user && req.user._id;

        UserModel.findById(id, {}, {}, (err, user) => {

            if (!user) {
                return res.status(404)
                    .json({
                        message: `User with the id ${id} was not found`,
                        resultCode: 1
                    });
            } else if (err) {
                return res.status(500)
                    .json({
                        message: "Some error occurred",
                        error: err,
                        resultCode: 1
                    });
            } else {
                user.deleteOne({}, (err) => {
                    return res.status(200)
                        .json({
                            message: `User with the id ${id} was deleted`,
                            resultCode: 0
                        });
                })
            }

        });
    }

    updateUsername = function (req, res) {
        const postData = {
            username: req.body.username
        }

        const user = req.user;

        if (!user) {
            return res.status(403)
                .json({
                    message: "You are not authorized to do it",
                    resultCode: 1
                })
        }

        user.username = postData.username;

        user.save()
            .then(() => {
                return res.status(200)
                    .json({
                        message: "Username was updated",
                        resultCode: 1
                    })
            })
            .catch((err) => {
                return res.status(500)
                    .json({
                        message: "Some error occurred",
                        error: err,
                        resultCode: 1
                    });
            })
    }

    verify = function (req, res) {
        const confirmationToken = req.query.hash;

        if (!confirmationToken) {
            return res.status(403)
                .json({
                    message: "Confirmation hash was not provided",
                    resultCode: 1
                })
        } else {
            ConfirmationTokenModel.findOne({token: confirmationToken}, (err, token) => {
                if (!token) {
                    return res.status(404)
                        .json({
                            message: `The token ${token} no longer exist`,
                            resultCode: 1
                        })
                } else {
                    UserModel.findOne({confirmationToken: mongoose.Types.ObjectId(token._id)}, (err, user) => {
                        if (!user || err) {
                            return res.status(404)
                                .json({
                                    message: "User with this hash does not exist",
                                    error: err,
                                    resultCode: 1
                                });
                        }

                        if (user.confirmed) {
                            return res.status(200)
                                .json({
                                    message: "User with this hash have been already confirmed",
                                    user: {
                                        ...user._doc,
                                        _id: "",
                                        password: "",
                                        confirmationToken: "",
                                        authTokens: "",
                                        passwordResetToken: "",
                                        tasksList: "",
                                        categoriesList: ""
                                    },
                                    resultCode: 0
                                });
                        }

                        user.confirmed = true;
                        let authToken = user.generateAuthToken()

                        user.save()
                            .then(() => {
                                return res.status(200)
                                    .json({
                                        message: "Account was confirmed successfully",
                                        user: {
                                            ...user._doc,
                                            _id: "",
                                            password: "",
                                            confirmationToken: "",
                                            authTokens: "",
                                            passwordResetToken: "",
                                            tasksList: "",
                                            categoriesList: ""
                                        },
                                        authToken: authToken,
                                        resultCode: 0
                                    })
                            })
                            .catch((err) => {
                                return res.status(500)
                                    .json({
                                        message: "Some error occurred",
                                        error: err,
                                        resultCode: 1
                                    })
                            })
                    })
                }
            })
        }
    }

    cancelRegistration = function (req, res) {
        const confirmationToken = req.query.hash;

        if (!confirmationToken) {
            return res.status(403)
                .json({
                    message: "Confirmation token was not provided",
                    resultCode: 1
                })
        } else {
            ConfirmationTokenModel.findOne({token: confirmationToken}, (err1, token) => {
                if (!token || err1) {
                    return res.status(404)
                        .json({
                            message: `The token ${token} no longer exist`,
                            resultCode: 1
                        })
                } else {
                    UserModel.findOne({confirmationToken: mongoose.Types.ObjectId(token._id)},
                        (err2, user) => {
                            if (!user) {
                                return res.status(404)
                                    .json({
                                        message: "User associated with provided token was not found",
                                        resultCode: 1
                                    });
                            } else if (err2) {
                                return res.status(500)
                                    .json({
                                        message: "Some error occurred",
                                        error: err2,
                                        resultCode: 1
                                    });
                            } else {
                                user.deleteOne({}, (err3) => {
                                    return res.status(200)
                                        .json({
                                            message: "User registration was canceled",
                                            resultCode: 0
                                        });
                                });
                            }
                        })
                }
            })
        }
    }

    auth = function (req, res) {

        if (!req.user) {
            return res.status(403)
                .json({
                    message: "You are not authorised to do it",
                    resultCode: 1
                });
        } else {
            return res.status(200)
                .json({
                    message: "Successful authentication",
                    user: {
                        ...user._doc,
                        _id: "",
                        password: "",
                        confirmationToken: "",
                        authTokens: "",
                        passwordResetToken: "",
                        tasksList: "",
                        categoriesList: ""
                    },
                    resultCode: 0
                });
        }
    }

    login = function (req, res) {
        const postData = {
            email: req.body.email,
            password: req.body.password
        }

        UserModel.findByCredentials(postData.email, postData.password)
            .then((user) => {
                let authToken = user.generateAuthToken();

                if (user.confirmed) {
                    return res.status(200)
                        .json({
                            message: "Logged in successfully",
                            user: {
                                ...user._doc,
                                _id: "",
                                password: "",
                                confirmationToken: "",
                                authTokens: "",
                                passwordResetToken: "",
                                tasksList: "",
                                categoriesList: ""
                            },
                            token: authToken,
                            resultCode: 0
                        });
                } else {
                    ConfirmationTokenModel.findOne({user: mongoose.Types.ObjectId(user._id)},
                        (err, token) => {
                            if (!token || err) {
                                token = user.generateConfirmationToken();
                            }

                            mailer.sendMail(createConfirmationEmail(process.env.NODEMAILER_USER, postData.email, user.username, token.token),
                                (err, info) => {
                                    if (err) {
                                        return res.status(500)
                                            .json({
                                                message: "Some error occurred",
                                                error: err,
                                                resultCode: 1
                                            })
                                    } else {
                                        return res.status(200)
                                            .json({
                                                message: "Email confirmation is required",
                                                user: {
                                                    ...user._doc,
                                                    _id: "",
                                                    password: "",
                                                    confirmationToken: "",
                                                    authTokens: "",
                                                    passwordResetToken: "",
                                                    tasksList: "",
                                                    categoriesList: ""
                                                },
                                                resultCode: 0
                                            })
                                    }
                                });
                        });
                }
            })
            .catch((err) => {
                return res.status(401)
                    .json({
                        message: "Invalid login credentials",
                        error: err,
                        resultCode: 1
                    })
            })
    }

    logout = function (req, res) {
        const user = req.user

        user.deleteAuthToken(req.token)
            .then(() => {
                return res.status(200)
                    .json({
                        message: "Logged out successfully",
                        resultCode: 0
                    });
            })
            .catch((err) => {
                return res.status(500)
                    .json({
                        message: "Some error occurred",
                        error: err,
                        resultCode: 1
                    });
            })
    }

}

module.exports = UserController