const express = require('express')

const applyMiddlewares = require('./middlewares/applyMiddlewares')
const createRoutes = require('./core/routes')

require('./core/mongo.js')

const app = express()

applyMiddlewares(app)
createRoutes(app)

const port = process.env.PORT | 3000

app.listen(port, () => {
    console.log(`App started at port ${port}`)
})