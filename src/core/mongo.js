const mongoose = require('mongoose')

const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log("MongoDB connection was established successfully: " + mongoURI)
    })
    .catch((error) => {
        console.log("Cannot connect to the MongoDB, " + error);
    });