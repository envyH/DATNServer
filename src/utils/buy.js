const STATUS_BUY = {
    IN_CART: { value: 0 },
    NOW: { value: 1 }
};

Object.keys(STATUS_BUY).forEach(key => {
    const status = STATUS_BUY[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusBuy = (value) => {
    for (let key in STATUS_BUY) {
        if (STATUS_BUY[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_BUY,
    checkStatusBuy
}
