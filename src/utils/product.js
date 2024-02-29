const STATUS_PRODUCT = {
    OUT_OF_STOCK: { value: 0 },
    STOCKING: { value: 1 },
};

Object.keys(STATUS_PRODUCT).forEach(key => {
    const status = STATUS_PRODUCT[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusProduct = (value) => {
    for (let key in STATUS_PRODUCT) {
        if (STATUS_PRODUCT[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_PRODUCT,
    checkStatusProduct
}