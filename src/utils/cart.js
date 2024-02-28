const STATUS_CART = {
    DEFAULT: { value: 0 },
    SELECTED: { value: 1 },
    BUYING: { value: 2 }
};

Object.keys(STATUS_CART).forEach(key => {
    const status = STATUS_CART[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusInCart = (value) => {
    for (let key in STATUS_CART) {
        if (STATUS_CART[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_CART,
    checkStatusInCart
}