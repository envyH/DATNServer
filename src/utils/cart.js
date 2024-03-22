const MAX_CART = 20;
const STATUS_CART = {
    DELETED: { value: -1 },
    DEFAULT: { value: 0 },
    SELECTED: { value: 1 },
    BOUGHT: { value: 2 },
    BUYING: { value: 3 }
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
    MAX_CART,
    STATUS_CART,
    checkStatusInCart
}
