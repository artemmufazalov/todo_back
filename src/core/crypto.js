const crypto = require('crypto');

const key = process.env.TASKS_ENCRYPTION_KEY
const algorithm = process.env.TASKS_ENCRYPTION_ALGORITHM
const ivLength = process.env.TASKS_ENCRYPTION_IV_LENGTH

function encrypt(text) {
    let iv = crypto.randomBytes(ivLength);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex') + iv.toString('hex');
}

function decrypt(text) {
    let textBuffer = Buffer.from(text, 'hex')
    let iv = textBuffer.subarray(-ivLength)
    let encryptedText = textBuffer.subarray(0, -ivLength)
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {decrypt, encrypt};