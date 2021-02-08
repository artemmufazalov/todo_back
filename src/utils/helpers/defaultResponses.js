const defaultServerError = (res, err) => {
    return res.status(500)
        .json({
            message: "Some error occurred",
            messageRus: "Произошла ошибка, операция не может быть выполнена",
            error: err,
            resultCode: 1
        })
}

module.exports = {defaultServerError}