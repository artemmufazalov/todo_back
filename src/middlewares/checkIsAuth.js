const jwt = require('jsonwebtoken') ;
const UserModel = require('../models/User')

let allowedRoutesStrict = ['/user', '/user/login']
let allowedRoutes = ['/user/verify', '/user/password']

let isRouteAllowed = (path) => {
    return allowedRoutes.reduce((res, curr) => res || path.toString().includes(curr), false) ||
        allowedRoutesStrict.includes(path.toString())
}

const checkIsAuth = async (req, res, next) => {

    if (req.method === "OPTIONS" || isRouteAllowed(req.path)) {return next()}

    const token = req.headers.Authorization;

    if (!token) {
        return res.status(403)
            .json({
                message: "Authorization is required to access this resource",
                resultCode: 1,
            });
    }

    console.log("Provided token: " + token);

    jwt.verify(token, process.env.JWT_KEY, (err, decodedData) => {
        if (err) {
            return res.status(401)
                .json({
                    message: "Token is invalid or expired",
                    error: err,
                    resultCode: 1
                })
        } else {
            UserModel.findOne({_id: decodedData._id}, {}, (err, user) => {
                if (!user) {
                    return res.status(404)
                        .json({
                            message: "User associated with this token does not exist",
                            error: err,
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