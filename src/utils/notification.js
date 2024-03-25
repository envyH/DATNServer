const STATUS_NOTIFICATION = {
    DELETED: { value: -1 },
    SEEN: { value: 0 },
    DEFAULT: { value: 1 }
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

const checkStatus = (value) => {
    for (let key in STATUS_NOTIFICATION) {
        if (STATUS_NOTIFICATION[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_NOTIFICATION,
    checkStatus
}
