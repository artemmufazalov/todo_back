const jwt = require('jsonwebtoken') ;

const UserModel = require('../models/User')
const {defaultServerError} = require("../utils/helpers/defaultResponses");

let allowedRoutesStrict = ['/user/register', '/user/login', 'user/password/update', 'user/password/restore']
let allowedRoutes = ['/user/verify']

let isRouteAllowed = (path) => {
    return allowedRoutes.reduce((res, curr) => res || path.toString().includes(curr), false) ||
        allowedRoutesStrict.includes(path.toString())
}

const checkIsAuth = async (req, res, next) => {

    if (req.method === "OPTIONS" || isRouteAllowed(req.path)) {return next()}

    const token = req.headers["x-access-token"] || req.headers["authorization"];

    if (!token) {
        return res.status(403)
            .json({
                message: "Authorization is required to access this resource",
                messageRus: "Чтобы получить доступ, вам необходимо авторизоваться",
                resultCode: 1,
            });
    }

    console.log("Provided token: " + token);

    jwt.verify(token, process.env.JWT_KEY, (err, decodedData) => {
        if (err) {
            return res.status(401)
                .json({
                    message: "Token is invalid or expired",
                    messageRus: "Представленный токен более не действителен",
                    error: err,
                    resultCode: 1
                })
        } else {
            UserModel.findOne({_id: decodedData._id}, {}, (err, user) => {
                if (!user) {
                    return res.status(404)
                        .json({
                            message: "User associated with this token does not exist",
                            messageRus: "Пользователь с данным токеном не существует",
                            error: err,
                            resultCode: 1
                        });
                } else if (err) {
                    return defaultServerError(res, err)
                } else {
                    user.updateAuthToken(token);

                    req.user = user;
                    req.token = token;
                    console.log("Authorized request");

                    next();
                }
            })
        }
    })

}

module.exports = checkIsAuth;