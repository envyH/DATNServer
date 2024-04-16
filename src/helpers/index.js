const formatPhoneNumber = (phoneNumber) => {
    const numericPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (numericPhoneNumber.startsWith("0")) {
        return `84${numericPhoneNumber.slice(1)}`;
    }
    return numericPhoneNumber;
};

module.exports = {
    formatPhoneNumber
}
