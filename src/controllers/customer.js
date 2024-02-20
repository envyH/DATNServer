const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneNumberRegex = /^(?:\+84|0)[1-9]\d{8}$/;


const UploadFileFirebase = require('../services/uploadFileFirebase');
const CustomerModel = require('../models/model.customer');
const { sendEmailVerifyCus } = require("../services/otp");

class CustomerController {

    register = async (req, res) => {
        let email = req.body.email;
        let password = req.body.password;
        let fullName = req.body.full_name;
        let phoneNumber = req.body.phone_number;
        let date = new Date();
        let dataTime = moment(date).tz(specificTimeZone).format(formatType);

        let ipAddress = process.env.IP_ADDRESS;
        let ipAddressLocal = process.env.IP_LOCAL;
        let portLocal = process.env.PORT;


        if (email === undefined || email.trim().length == 0) {
            return res.send({ message: "email require", statusCode: 400, code: "auth/missing-email" });
        }
        if (password === undefined || password.trim().length == 0) {
            return res.send({ message: "password require", statusCode: 400, code: "auth/missing-password" });
        }
        if (fullName === undefined || fullName.trim().length == 0) {
            return res.send({ message: "full-name require", statusCode: 400, code: "auth/missing-fullname" });
        }
        if (phoneNumber === undefined || phoneNumber.trim().length == 0) {
            return res.send({ message: "phone-number require", statusCode: 400, code: "auth/missing-phonenumber" });
        }

        if (!phoneNumberRegex.test(phoneNumber)) {
            return res.send({
                message: "The phone number is not in the correct format",
                statusCode: 400,
                code: "auth/non-valid-phonenumber"
            });
        }

        if (!passwordRegex.test(password)) {
            return res.send({
                message:
                    "Minimum password 8 characters, at least 1 capital letter, 1 number and 1 special character",
                statusCode: 400,
                code: "auth/non-valid-password"
            });
        }

        try {
            // TODO check exists
            let cusByPhone = await CustomerModel.customerModel.findOne({ phone_number: phoneNumber, }).lean();
            let cusByEmail = await CustomerModel.customerModel.findOne({ email: email }).lean();
            if (cusByPhone) {
                return res.send({
                    message: "phone number already exists",
                    statusCode: 400,
                    code: "auth/phone-exists"
                });
            }
            if (cusByEmail) {
                if (cusByEmail.status === "Not verified") {
                    const link = `http://${ipAddressLocal}:${portLocal}/v1/api/customer/verify?type=${"register"}&key=${cusByEmail._id.toString()}`;
                    const text = `STECH xin chào bạn\nẤn vào đây để xác thực tài khoản: ${link}`;
                    let index = sendEmailVerifyCus(email, text);
                    if (index === 0) {
                        return res.send({
                            message: "send verify account fail",
                            statusCode: 400,
                            code: "auth/unsend-mail"
                        });
                    }
                    return res.send({
                        message: "Account has been registered\nPlease verify your account in email!",
                        statusCode: 400,
                        code: "auth/account-exists"
                    })
                }
                return res.send({
                    message: "email already exists",
                    statusCode: 400,
                    code: "auth/email-exists"
                });
            }
            // if (cusByPhone) {
            //     const link = `http://${ipAddressLocal}:${portLocal}/v1/api/customer/verify?type=${"register"}&key=${cusByPhone._id.toString()}`;
            //     const text = `STECH xin chào bạn\nẤn vào đây để xác thực tài khoản: ${link}`;
            //     let index = sendEmailVerifyCus(email, text);
            //     if (index === 0) {
            //         return res.send({
            //             message: "send verify account fail",
            //             statusCode: 400,
            //             code: "auth/unsend-mail"
            //         });
            //     }
            //     if (cusByPhone.status === "Not verified") {
            //         return res.send({
            //             message: "Account has been registered\nPlease verify your account in email!",
            //             statusCode: 400,
            //             code: "auth/account-exists"
            //         })
            //     }
            //     return res.send({
            //         message: "phone number already exists",
            //         statusCode: 400,
            //         code: "auth/phone-exists"
            //     });
            // }
            // TODO create customer
            let cus = new CustomerModel.customerModel({
                email: email,
                password: password,
                full_name: fullName,
                phone_number: phoneNumber,
                created_time: dataTime,
            });
            // TODO send mail verify
            const link = `http://${ipAddressLocal}:${portLocal}/v1/api/customer/verify?type=${"register"}&key=${cus._id.toString()}`;
            const text = `STECH xin chào bạn\nẤn vào đây để xác thực tài khoản: ${link}`;
            let index = sendEmailVerifyCus(email, text);
            if (index === 0) {
                return res.send({
                    message: "send verify account fail",
                    statusCode: 400,
                    code: "auth/unsend-mail"
                });
            } else {
                await cus.save();
            }
            return res.send({
                message: "Register success!\nPlease verify your account in email.",
                statusCode: 200,
                code: "auth/verify"
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: `auth/${e.code}`
            });
        }
    }
    // TODO verify
    verify = async (req, res) => {
        let key = req.query.key;
        let type = req.query.type;
        try {
            let cus = await CustomerModel.customerModel.findById(key);
            if (cus) {
                if (cus.status === "Not verified") {
                    cus.status = "Has been activated";
                    await cus.save();
                    await CustomerModel.customerModel.deleteMany({ phone_number: cus.phone_number, status: "Not verified" });
                }
            } else {
                return res.send({
                    message: "Activation failed",
                    statusCode: 400,
                    code: "auth/active-fail"
                });
            }
            return res.send({
                message: "Has been activated",
                statusCode: 200,
                code: "auth/activated"
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(), statusCode: 400,
                code: `auth/${e.code}`
            });
        }
    }

}

module.exports = new CustomerController;

