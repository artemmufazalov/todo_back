const nodemailer = require('nodemailer');

const options = {
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: true,
    requireTLS: true,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    },
    logger: true
};

const transport = nodemailer.createTransport(options);

module.exports = transport