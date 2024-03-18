const STATUS_ORDER = {
    WAITCONFIRM: { value: 0 },
    DEMO1: { value: 1 },
    DEMO2: { value: 2 }
};


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
    STATUS_ORDER,
    checkStatusOrder,
    sortObject
}
