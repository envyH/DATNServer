require("dotenv").config();
const crypto = require("crypto");

const STATUS_MESSAGE = {
    SENDING: { value: 0 },
    SENT: { value: 1 },
    RECEIVED: { value: 2 },
    SEEN: { value: 3 },
};

const TYPE_MESSAGE = {
    IMAGE: { value: 0 },
    TEXT: { value: 1 },
    VIDEO: { value: 2 },
    FILE: { value: 3 },
};

Object.keys(STATUS_MESSAGE).forEach(key => {
    const status = STATUS_MESSAGE[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

Object.keys(TYPE_MESSAGE).forEach(key => {
    const status = TYPE_MESSAGE[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusMessage = (value) => {
    for (let key in STATUS_MESSAGE) {
        if (STATUS_MESSAGE[key].value === value) {
            return true;
        }
    }
    return false;
}

const checkTypeMessage = (value) => {
    for (let key in TYPE_MESSAGE) {
        if (TYPE_MESSAGE[key].value === value) {
            return true;
        }
    }
    return false;
}


const encryptedMessage = async (message) => {
    // TODO Mã hoá tin nhắn
    let messageEncrypted
    const algorithm = process.env.ALGORITHM;
    const IV_LENGTH = 16;
    const ENCRYPTION_KEY = process.env.SECRET_KEY;
    const hash = crypto.createHash("sha1");
    hash.update(ENCRYPTION_KEY)
    const digestResult = hash.digest();
    // Chuyển đổi kết quả digest thành Uint8Array
    const uint8Array = new Uint8Array(digestResult);
    // Sử dụng slice từ Uint8Array.prototype
    const keyUint8Array = uint8Array.slice(0, 16);
    // Chuyển đổi kết quả Uint8Array về Buffer nếu cần
    const keyBuffer = Buffer.from(keyUint8Array);

    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    messageEncrypted = iv.toString('hex') + ':' + encrypted;

    return messageEncrypted;
}

const decryptedMessage = async (messageEncrypted) => {
    let message = ''
    if (messageEncrypted.length <= 0) {
        return messageEncrypted
    }

    const algorithm = process.env.ALGORITHM;
    const ENCRYPTION_KEY = process.env.SECRET_KEY;
    const hash = crypto.createHash("sha1");
    hash.update(ENCRYPTION_KEY)
    const digestResult = hash.digest();
    const uint8Array = new Uint8Array(digestResult);
    const keyUint8Array = uint8Array.slice(0, 16);
    const keyBuffer = Buffer.from(keyUint8Array);
    let textParts = messageEncrypted.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf8');
    message = decrypted;
    return message;
}

module.exports = {
    STATUS_MESSAGE,
    TYPE_MESSAGE,
    checkStatusMessage,
    checkTypeMessage,
    encryptedMessage,
    decryptedMessage
}
