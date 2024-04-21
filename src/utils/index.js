const isNumber = (str) => {
    return Number.isInteger(parseInt(str)) && !isNaN(parseInt(str));
}

module.exports = {
    isNumber
}
