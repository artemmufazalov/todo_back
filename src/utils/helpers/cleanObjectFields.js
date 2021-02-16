module.exports = {
    cleanObjectFields: (obj, fieldsArray) => {
        let instance = obj.toObject()

        fieldsArray.forEach(fieldName => {
            delete instance[fieldName]
        })

        return instance
    }
}