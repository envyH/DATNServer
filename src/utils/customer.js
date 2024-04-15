const STATUS_CUSTOMER = {
    BANNED: { value: -1 },
    NOT_VERIFIED: { value: 0 },
    ACTIVATED: { value: 1 },
};

Object.keys(STATUS_CUSTOMER).forEach(key => {
    const status = STATUS_CUSTOMER[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusCustomer = (value) => {
    for (let key in STATUS_CUSTOMER) {
        if (STATUS_CUSTOMER[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    STATUS_CUSTOMER,
    checkStatusCustomer
}
