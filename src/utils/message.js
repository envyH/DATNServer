const STATUS_MESSAGE = {
    SENDING: { value: 0 },
    SENT: { value: 1 },
    RECEIVED: { value: 2 },
    SEEN: { value: 3 },
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

const checkStatusMessage = (value) => {
    for (let key in STATUS_MESSAGE) {
        if (STATUS_MESSAGE[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_MESSAGE,
    checkStatusMessage
}
