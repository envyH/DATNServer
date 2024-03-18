const isNumeric = (str) => {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
}

const isNumber = (x) => {
    if (typeof x === 'number') {
        return x === Math.floor(x);
    } else if (typeof x === 'string') {
        return parseInt(x, 10) == x && !isNaN(parseInt(x, 10));
    } else {
        return false;
    }
}

module.exports = {
    isNumeric,
    isNumber
}
