const express = require('express')
const bodyParser = require('body-parser')

const createRoutes = require('./core/routes')

require('./core/mongo.js')

const app = express()

app.use(bodyParser.json())
createRoutes(app)

const port = process.env.PORT | 3000

app.listen(port, () => {
    console.log(`App started at port ${port}`)
})