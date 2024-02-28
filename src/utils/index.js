function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
function isNumber(x) {
    // Kiểm tra xem đầu vào có phải là một số không
    if (typeof x === 'number') {
        // Nếu đầu vào là một số, kiểm tra xem nó có phải là một số nguyên không
        return x === Math.floor(x);
    } else if (typeof x === 'string') {
        // Nếu đầu vào là một chuỗi, cố gắng chuyển đổi nó thành một số nguyên và kiểm tra
        // Sử dụng parseInt để chuyển đổi chuỗi thành số nguyên
        return parseInt(x, 10) == x && !isNaN(parseInt(x, 10));
    } else {
        // Nếu đầu vào không phải là số hoặc chuỗi, trả về false
        return false;
    }
}

module.exports = {
    isNumeric,
    isNumber
}