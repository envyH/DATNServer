const STATUS_OVERLAY_MESSAGE = {
    WATCHED: { value: 0 },
    DEFAULT: { value: 1 },
};

Object.keys(STATUS_OVERLAY_MESSAGE).forEach(key => {
    const status = STATUS_OVERLAY_MESSAGE[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusOverlayMessage = (value) => {
    for (let key in STATUS_OVERLAY_MESSAGE) {
        if (STATUS_OVERLAY_MESSAGE[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_OVERLAY_MESSAGE,
    checkStatusOverlayMessage
}
