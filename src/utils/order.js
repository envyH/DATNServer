const STATUS_ORDER = {
    WAIT_CONFIRM: { value: 0 },
    PREPARE: { value: 1 },
    IN_TRANSIT: { value: 2 },
    PAID: { value: 3 },
    CANCEL: { value: 4 }
};
const ORDERS_KEY = ["waitingList", "prepareList", "inTransitList", "paidList", "cancelList"]; // match client

Object.keys(STATUS_ORDER).forEach(key => {
    const method = STATUS_ORDER[key];
    Object.defineProperty(method, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusOrder = (value) => {
    for (let key in STATUS_ORDER) {
        if (STATUS_ORDER[key].value === value) {
            return true;
        }
    }
    return false;
}

const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = {
    ORDERS_KEY,
    STATUS_ORDER,
    checkStatusOrder,
    sortObject
}
