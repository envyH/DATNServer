const TYPE_LOGIN = {
    ADMIN: { value: 0, role: "admin" },
    EMPLOYEE: { value: 1, role: "employee " },
};

Object.keys(TYPE_LOGIN).forEach(key => {
    const status = TYPE_LOGIN[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkTypeLogin = (value) => {
    for (let key in TYPE_LOGIN) {
        if (TYPE_LOGIN[key].value === value) {
            return true;
        }
    }
    return false;
}

module.exports = {
    TYPE_LOGIN,
    checkTypeLogin
}
