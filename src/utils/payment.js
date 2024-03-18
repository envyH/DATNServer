const PAYMENT_METHOD = {
    ON_DELIVERY: { value: 0 },
    E_BANKING: { value: 1 },
    ZALO_PAY: { value: 2 }
};


Object.keys(PAYMENT_METHOD).forEach(key => {
    const method = PAYMENT_METHOD[key];
    Object.defineProperty(method, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkPaymentMethod = (value) => {
    for (let key in PAYMENT_METHOD) {
        if (PAYMENT_METHOD[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    PAYMENT_METHOD,
    checkPaymentMethod
}
