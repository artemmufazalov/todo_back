const validate = require('../utils/validators/validate');
const {createConfirmationEmail, createPasswordResetEmail, createPasswordRestoreEmail} = require('../utils/nodemailerEmailTemplates/emails');
const {defaultServerError} = require("../utils/helpers/defaultResponses");
const mailer = require('../core/nodemailer');
const UserModel = require('../models/User');
const ConfirmationTokenModel = require('../models/ConfirmationToken');
const PasswordResetTokenModel = require('../models/PasswordResetToken');

class UserController {

    create(req, res) {
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
                        messageRus: "Пользователь с данным email уже существует",
                        resultCode: 1
                    });
            } else {
                let errors = validate(postData);
                if (errors.email || errors.password || errors.name) {
                    return res.status(401)
                        .json({
                            message: "Values didn't pass the validation",
                            messageRus: "Значения не прошли валидацию",
                            errors: errors,
                            resultCode: 1
                        })
                } else {
                    const user = new UserModel(postData);
                    user.save((err, user) => {
                        if (err) {
                            return defaultServerError(res, err)
                        } else {
                            let confirmationToken = user.generateConfirmationToken()

                            mailer.sendMail(createConfirmationEmail(process.env.NODEMAILER_USER, postData.email, user.username, confirmationToken),
                                (err, info) => {
                                    if (err) {
                                        UserModel.findById(user._id, {}, {}, (err, user) => {
                                            user.deleteOne({}, () => {
                                                return res.status(500).json({
                                                    message: "Some server error, registration could not be completed",
                                                    messageRus: "На сервере произошла ошибка, регистрация не может быть завершена",
                                                    resultCode: 1
                                                });
                                            });
                                        })
                                    } else {
                                        return res.status(200).json({
                                            message: "User created successfully",
                                            messageRus: "Пользователь был успешно создан",
                                            nextMessage: "Email confirmation is required",
                                            nextMessageRus: "Требуется подтверждение email адреса",
                                            user: user.cleanSensitive(),
                                            resultCode: 0
                                        });
                                    }
                                }
                            );
                        }
                    })
                }
            }
        })
    }

    delete(req, res) {
        const id = req.user && req.user._id;

        UserModel.findById(id, {}, {}, (err, user) => {

            if (err) {
                return defaultServerError(res, err)
            } else {
                user.deleteOne({}, (err) => {
                    return res.status(200)
                        .json({
                            message: `User with the id ${id} was deleted`,
                            messageRus: `Пользователь с id ${id} был успешно удален`,
                            resultCode: 0
                        });
                })
            }

        });
    }

    updateUsername(req, res) {
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

        user.save((err, newUser) => {
            if (err) {
                return defaultServerError(res, err)
            } else {
                return res.status(200)
                    .json({
                        message: "Username was updated",
                        messageRus: "Имя пользователя успешно изменено",
                        user: newUser.cleanSensitive(),
                        resultCode: 0
                    })
            }
        })
    }

    verify(req, res) {
        const confirmationToken = req.query.hash;

        if (!confirmationToken) {
            return res.status(403)
                .json({
                    message: "Confirmation hash was not provided",
                    messageRus: "Отсутствует токен для подтверждения",
                    resultCode: 1
                })
        } else {
            ConfirmationTokenModel.findOne({token: confirmationToken}, (err, token) => {
                if (!token) {
                    return res.status(404)
                        .json({
                            message: `The token ${token} isn't valid`,
                            messageRus: `Токен ${token} не действителен`,
                            resultCode: 1
                        })
                } else {
                    UserModel.findOne({confirmationToken: token._id}, (err, user) => {
                        if (!user || err) {
                            return res.status(404)
                                .json({
                                    message: "User with this hash does not exist",
                                    messageRus: "Пользователь с данным токеном не существует",
                                    error: err,
                                    resultCode: 1
                                });
                        } else if (user && user.confirmed) {
                            let authToken = user.generateAuthToken()

                            return res.status(200)
                                .json({
                                    message: "User with this hash have been already confirmed",
                                    messageRus: "Аккаунт пользователя уже подтвержден",
                                    user: user.populate(['tasksList', 'categoriesList']).cleanSensitive(),
                                    authToken: authToken,
                                    resultCode: 0
                                });
                        } else {
                            user.confirmed = true
                            let authToken = user.generateAuthToken()

                            user.save((err, user) => {
                                if (err) {
                                    return defaultServerError(res, err)
                                } else {
                                    return res.status(200)
                                        .json({
                                            message: "Account was confirmed successfully",
                                            messageRus: "Аккаунт успешно подтвержден",
                                            user: user.populate(['tasksList', 'categoriesList']).cleanSensitive(),
                                            authToken: authToken,
                                            resultCode: 0
                                        })
                                }
                            })
                        }
                    })
                }
            })
        }
    }

    cancelRegistration(req, res) {
        const confirmationToken = req.query.hash;

        if (!confirmationToken) {
            return res.status(403)
                .json({
                    message: "Confirmation token was not provided",
                    messageRus: "Отсутствует токен подтверждения",
                    resultCode: 1
                })
        } else {
            ConfirmationTokenModel.findOne({token: confirmationToken}, (err, token) => {
                if (!token || err) {
                    return res.status(404)
                        .json({
                            message: `The token ${token} no longer exist`,
                            messageRus: `Токен ${token} не действителен`,
                            resultCode: 1
                        })
                } else {
                    UserModel.findOne({confirmationToken: token._id},
                        (err, user) => {
                            if (!user) {
                                return res.status(404)
                                    .json({
                                        message: "User associated with provided token was not found",
                                        messageRus: "Пользователь с данным токеном не найден",
                                        resultCode: 1
                                    });
                            } else if (err) {
                                return defaultServerError(res, err)
                            } else {
                                user.deleteOne((err) => {
                                    return res.status(200)
                                        .json({
                                            message: "User registration was canceled",
                                            messageRus: "Регистрация пользователя отменена",
                                            resultCode: 0
                                        });
                                });
                            }
                        })
                }
            })
        }
    }

    auth(req, res) {
        let user = req.user

        return res.status(200)
            .json({
                message: "Successful authentication",
                messageRus: "Успешная авторизация",
                user: user.populate(['tasksList', 'categoriesList']).cleanSensitive(),
                resultCode: 0
            });
    }

    login(req, res) {
        const postData = {
            email: req.body.email,
            password: req.body.password
        }

        UserModel.findByCredentials(postData.email, postData.password, (err, user) => {
            if (err) {
                return res.status(401)
                    .json({
                        message: "Invalid login credentials",
                        messageRus: "Неверный логин или пароль",
                        error: err,
                        resultCode: 1
                    })
            } else {
                let authToken = user.generateAuthToken();

                if (user.confirmed) {
                    return res.status(200)
                        .json({
                            message: "Logged in successfully",
                            messageRus: "Авторизация прошла успешно",
                            user: user.populate(['tasksList', 'categoriesList']).cleanSensitive(),
                            authToken: authToken,
                            resultCode: 0
                        });
                } else {
                    ConfirmationTokenModel.findOne({user: user._id},
                        (err, token) => {
                            if (!token || err) {
                                token = user.generateConfirmationToken();
                            }

                            mailer.sendMail(createConfirmationEmail(process.env.NODEMAILER_USER, postData.email, user.username, token.token),
                                (err, info) => {
                                    if (err) {
                                        return defaultServerError(res, err)
                                    } else {
                                        return res.status(200)
                                            .json({
                                                message: "Email confirmation is required",
                                                messageRus: "Требуется подтверждение email",
                                                user: user.populate(['tasksList', 'categoriesList']).cleanSensitive(),
                                                resultCode: 0
                                            })
                                    }
                                });
                        });
                }

            }
        })
    }

    logout(req, res) {
        const user = req.user

        user.deleteAuthToken(req.token, (err, token) => {
            if (err) {
                return defaultServerError(res, err)
            } else {
                return res.status(200)
                    .json({
                        message: "Logged out successfully",
                        messageRus: "Вы вышли из аккаунта",
                        resultCode: 0
                    });
            }
        })
    }

    requestPasswordChange(req, res) {
        let user = req.user
        let hash = user.generatePasswordResetToken()

        mailer.sendMail(createPasswordResetEmail(process.env.NODEMAILER_USER, user.email, user.username, hash),
            (err, info) => {
                if (err) {
                    return res.status(500).json({
                        message: "Some server error, cannot request password reset",
                        messageRus: "Возникла ошибка, смена пароля невозможна",
                        error: err,
                        resultCode: 1
                    });
                } else {
                    return res.status(200).json({
                        message: "Password reset was requested. To complete you need follow the link in the email",
                        nextMessage: "Запрос на смену пароля был получен. Чтобы продолжить, перейдите по ссылке в email",
                        resultCode: 0
                    });
                }
            })
    }

    requestPasswordRestore(req, res) {
        let email = req.body.email

        UserModel.findOne({email: email}, (err, user) => {
            if (!user || err) {
                return res.status(404)
                    .json({
                        message: "User with this email was not found",
                        messageRus: "Пользователь с данным email не существует",
                        resultCode: 1
                    })
            } else {
                let hash = user.generatePasswordResetToken()

                mailer.sendMail(createPasswordRestoreEmail(process.env.NODEMAILER_USER, user.email, user.username, hash),
                    (err, info) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Some server error, cannot request password restore",
                                messageRus: "Возникла ошибка, на данный момент восстановление пароля невозможно",
                                error: err,
                                resultCode: 1
                            });
                        } else {
                            return res.status(200).json({
                                message: "Password restore was requested. To complete you need follow the link in the email",
                                nextMessage: "Запрос на восстановление пароля был получен. Чтобы продолжить, перейдите по ссылке в email",
                                resultCode: 0
                            });
                        }
                    })
            }
        })
    }

    changePassword(req, res) {
        let newPassword = req.body.password
        let hash = req.body.hash
        let that = this

        if (!hash) {
            return res.status(403)
                .json({
                    message: "Hash was not provided",
                    messageRus: "Операция не может быть выполнена ввиду отсутствия токена",
                    resultCode: 1
                })
        }

        let errors = validate(newPassword)
        if (errors.password) {
            return res.status(401)
                .json({
                    message: "Values didn't pass the validation",
                    messageRus: "Предоставленные значения не прошли валидацию",
                    errors: errors,
                    resultCode: 1
                })
        }

        PasswordResetTokenModel.findOne({hash: hash}, (err, token) => {
            if (!token || err) {
                return res.status(401)
                    .json({
                        message: "Provided token is no longer valid",
                        messageRus: "Ваш токен более не действителен",
                        error: err,
                        resultCode: 1
                    })
            } else {
                UserModel.findOne({passwordResetToken: token._id}, (err, user) => {
                    if (err) {
                        return defaultServerError(res, err)
                    } else {
                        user.password = newPassword
                        user.save((err, newUser) => {
                            if (err) {
                                return defaultServerError(res, err)
                            } else {
                                req.body.email = newUser.email
                                req.body.password = newPassword
                                that.login(req, res)
                            }
                        })
                    }
                })
            }
        })
    }

}

module.exports = UserController