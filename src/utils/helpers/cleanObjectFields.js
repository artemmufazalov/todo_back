module.exports = {
    cleanObjectFields: (obj, fieldsArray) => {
        if (!obj){
            return obj
        }

        fieldsArray.forEach(fieldName => {
            delete obj[fieldName]
        })

        return obj
    }
}