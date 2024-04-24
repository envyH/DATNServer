const { admin } = require('../configs/firebase');


const STATUS_NOTIFICATION = {
    DELETED: { value: -1 },
    SEEN: { value: 0 },
    DEFAULT: { value: 1 }
};
const TYPE_NOTIFICATION = {
    DEFAULT: { value: -2 },
    MESSAGE: { value: -3 }
};

Object.keys(STATUS_NOTIFICATION).forEach(key => {
    const status = STATUS_NOTIFICATION[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

Object.keys(TYPE_NOTIFICATION).forEach(key => {
    const status = TYPE_NOTIFICATION[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatus = (value) => {
    for (let key in STATUS_NOTIFICATION) {
        if (STATUS_NOTIFICATION[key].value === value) {
            return true;
        }
    }
    return false;
}

const checkTypeNotification = (value) => {
    for (let key in TYPE_NOTIFICATION) {
        if (TYPE_NOTIFICATION[key].value === value) {
            return true;
        }
    }
    return false;
}

const sendNotification = async (title, content, type, img, fcm) => {
    let registrationTokens = [];
    registrationTokens.push(fcm);
    const message = {
        data: {
            title: title,
            body: content,
            type: type + "",
            imageURL: img !== undefined ? img.toString().trim().length > 0 ? img : "" : "",
        },
        token: fcm,
    };
    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });
}


module.exports = {
    STATUS_NOTIFICATION,
    TYPE_NOTIFICATION,
    checkStatus,
    checkTypeNotification,
    sendNotification
}
