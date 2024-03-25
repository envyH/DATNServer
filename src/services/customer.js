const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require('bcrypt');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneNumberRegex = /^(?:\+84|0)[1-9]\d{8}$/;


const FirebaseService = require('./firebase');
const OTPService = require('./otp');

const { AuthTokenModel, CustomerModel, MessageResponseModel } = require('../models');
const MessageResponses = require('../models/model.message.response');

const { formatPhoneNumber } = require('../helpers/index');

class CustomerService {

    register = async (req, res) => {
        let email = req.body.email;
        let password = req.body.password;
        let fullName = req.body.full_name;
        let phoneNumber = req.body.phone_number;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        const URL = process.env.URL;
        let ipAddressLocal = process.env.IP_LOCAL;
        let portLocal = process.env.PORT;


        let messageResponseError = new MessageResponses();
        const id = uuidv4();
        messageResponseError.setId(id);
        messageResponseError.setStatusCode(400);
        messageResponseError.setCreatedAt(timestamp);

        if (email === undefined || email.toString().trim().length == 0) {
            messageResponseError.setCode("auth/missing-email");
            messageResponseError.setContent("missing email");
            return res.send({ message: messageResponseError.toJSON(), statusCode: 400, code: "auth/missing-email", timestamp });
        }
        if (password === undefined || password.toString().trim().length == 0) {
            messageResponseError.setCode("auth/missing-password");
            messageResponseError.setContent("missing password");
            return res.send({ message: messageResponseError.toJSON(), statusCode: 400, code: "auth/missing-password", timestamp });
        }
        if (fullName === undefined || fullName.toString().trim().length == 0) {
            messageResponseError.setCode("auth/missing-fullname");
            messageResponseError.setContent("missing full-name");
            return res.send({ message: messageResponseError.toJSON(), statusCode: 400, code: "auth/missing-fullname", timestamp });
        }
        if (phoneNumber === undefined || phoneNumber.toString().trim().length == 0) {
            messageResponseError.setCode("auth/missing-phonenumber");
            messageResponseError.setContent("missing phone-number");
            return res.send({ message: messageResponseError.toJSON(), statusCode: 400, code: "auth/missing-phonenumber", timestamp });
        }

        if (!phoneNumberRegex.test(phoneNumber)) {
            messageResponseError.setCode("auth/non-valid-phonenumber");
            messageResponseError.setContent("The phone number is not in the correct format");
            return res.send({
                message: messageResponseError.toJSON(),
                statusCode: 400,
                code: "auth/non-valid-phonenumber",
                timestamp
            });
        }

        if (!passwordRegex.test(password)) {
            messageResponseError.setCode("auth/non-valid-password");
            messageResponseError.setContent("Minimum password 8 characters, at least 1 capital letter, 1 number and 1 special character");
            return res.send({
                message: messageResponseError.toJSON(),
                statusCode: 400,
                code: "auth/non-valid-password",
                timestamp
            });
        }

        try {
            // TODO check exists
            let cusByPhone = await CustomerModel.customerModel.findOne({ phone_number: phoneNumber, }).lean();
            let cusByEmail = await CustomerModel.customerModel.findOne({ email: email }).lean();
            if (cusByPhone) {
                messageResponseError.setCode("auth/phone-exists");
                messageResponseError.setContent("This phone number is registered to another account");
                return res.send({
                    message: messageResponseError.toJSON(),
                    statusCode: 400,
                    code: "auth/phone-exists",
                    timestamp
                });
            }
            if (cusByEmail) {
                if (cusByEmail.status === "Not verified") {
                    // const link = `http://${ipAddressLocal}:${portLocal}/v1/api/customer/verify?type=${"register"}&key=${cusByEmail._id.toString()}`;
                    const link = `${URL}/v1/api/customer/verify?type=${"register"}&key=${cusByEmail._id.toString()}`;
                    const text = `STECH xin chào bạn\nẤn vào đây để xác thực tài khoản: ${link}`;
                    let index = OTPService.sendEmailVerifyCus(email, text);
                    if (index === 0) {
                        messageResponseError.setCode("auth/unsend-mail");
                        messageResponseError.setContent("Send verify account fail");
                        return res.send({
                            message: messageResponseError.toJSON(),
                            statusCode: 400,
                            code: "auth/unsend-mail",
                            timestamp
                        });
                    }
                    messageResponseError.setCode("auth/account-exists");
                    messageResponseError.setContent("Account has been registered\nPlease verify your account in email!");
                    return res.send({
                        message: messageResponseError.toJSON(),
                        statusCode: 400,
                        code: "auth/account-exists",
                        timestamp
                    })
                }
                messageResponseError.setCode("auth/email-exists");
                messageResponseError.setContent("This email is registered to another account");
                return res.send({
                    message: messageResponseError.toJSON(),
                    statusCode: 400,
                    code: "auth/email-exists",
                    timestamp
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
            const passwordHash = await bcrypt.hash(password, 10);
            let cus = new CustomerModel.customerModel({
                email: email,
                password: passwordHash,
                full_name: fullName,
                phone_number: phoneNumber,
                created_at: timestamp,
            });
            // TODO send mail verify
            // const link = `http://${ipAddressLocal}:${portLocal}/v1/api/customer/verify?type=${"register"}&key=${cus._id.toString()}`;
            const link = `${URL}/v1/api/customer/verify?type=${"register"}&key=${cus._id.toString()}`;
            const text = `STECH xin chào bạn\nẤn vào đây để xác thực tài khoản: ${link}`;
            let index = OTPService.sendEmailVerifyCus(email, text);
            if (index === 0) {
                messageResponseError.setCode("auth/unsend-mail");
                messageResponseError.setContent("Send verify account fail.");
                return res.send({
                    message: messageResponseError.toJSON(),
                    statusCode: 400,
                    code: "auth/unsend-mail",
                    timestamp
                });
            } else {
                await cus.save();
            }
            cus.password = password;
            let messageResponse = new MessageResponses();
            let id = uuidv4();
            messageResponse.setId(id);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("auth/verify");
            messageResponse.setContent("Register success!\nPlease verify your account in email.");
            messageResponse.setCreatedAt(timestamp);
            return res.send({
                customer: cus,
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "auth/verify",
                timestamp
            });
        } catch (e) {
            console.log("===========register==========");
            console.log(e.message);
            console.log(e.code);
            messageResponseError.setCode(`auth/${e.code}`);
            messageResponseError.setContent(e.message.toString());
            return res.send({
                message: messageResponseError.toJSON(),
                statusCode: 400,
                code: `auth/${e.code}`,
                timestamp
            });
        }
    }
    // TODO verify
    verify = async (req, res) => {
        let key = req.query.key;
        let type = req.query.type;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);


        try {
            let cus = await CustomerModel.customerModel.findById(key);
            if (cus) {
                if (cus.status === "Not verified") {
                    cus.status = "Has been activated";
                    await cus.save();
                    await CustomerModel.customerModel.deleteMany({ phone_number: cus.phone_number, status: "Not verified" });
                }
            } else {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("auth/active-fail");
                messageResponse.setContent("Activation failed.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "auth/active-fail",
                    timestamp
                });
            }
            messageResponse.setStatusCode(200);
            messageResponse.setCode("auth/activated");
            messageResponse.setContent("Has been activated.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "auth/activated",
                timestamp
            });
        } catch (e) {
            console.log("=========verify=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/verify-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/verify-failed`,
                timestamp
            });
        }
    }

    login = async (req, res) => {
        let email = req.body.email;
        let phoneNumer = req.body.phone_number;
        let password = req.body.password;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (email === undefined || email.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-email");
            messageResponse.setContent("email require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-email", timestamp });
        }
        if (password === undefined || password.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-password");
            messageResponse.setContent("password require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-password", timestamp });
        }


        try {
            let cusEmail = await CustomerModel.customerModel.findOne({ email: email });
            let cusPhone = await CustomerModel.customerModel.findOne({ phone_number: phoneNumer });
            if (!cusEmail && !cusPhone) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("auth/account-notexist");
                messageResponse.setContent("Login failed: Account does not exist.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "auth/account-notexist",
                    timestamp
                });
            }

            if (cusPhone) {
                const match = await bcrypt.compare(password, cusPhone.password);
                if (!match) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("auth/incorrect-password");
                    messageResponse.setContent("Incorrect password.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "auth/incorrect-password",
                        timestamp
                    });
                }
                if (cusPhone.status !== "Has been activated") {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("auth/no-verify");
                    messageResponse.setContent("Your account has not been activated or has been locked, please contact hotline 0999999999 for help.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "auth/no-verify",
                        timestamp
                    });
                }
                const otp = Math.floor(100000 + Math.random() * 900000);
                const apiKey = process.env.API_KEY_INFOBIP;
                const baseUrl = process.env.BASE_URL_INFOBIP;
                const text = `STECH xin chào bạn\nMã OTP của bạn là: ${otp}\nVui lòng không cung cấp mã OTP cho bất kì ai`;
                const formatPhoneNumber = formatPhoneNumber(cusPhone.phone_number);
                console.log("=========login=========");
                console.log(formatPhoneNumber)
                const headers = {
                    Authorization: `App ${apiKey}`,
                    "Content-Type": "application/json",
                };

                const payload = {
                    messages: [
                        {
                            destinations: [{ formatPhoneNumber }],
                            text,
                        },
                    ],
                };

                // Gửi tin nhắn OTP bằng InfoBip REST API
                axios
                    .post(baseUrl, payload, { headers })
                    .then(async (response) => {
                        console.log("=========login=========");
                        console.log('Axios Response:', response.data);
                        cusPhone.otp = otp;
                        await cusPhone.save();
                        messageResponse.setStatusCode(200);
                        messageResponse.setCode("auth/verify-phone");
                        messageResponse.setContent("Please verify your account.");
                        return res.send({
                            message: messageResponse.toJSON(),
                            id: cusPhone._id,
                            customer: cusPhone,
                            statusCode: 200,
                            code: "auth/verify-phone",
                            timestamp
                        });
                    })
                    .catch((error) => {
                        console.log("=========login=========");
                        console.error(error.message.toString());
                        console.error(error.code.toString());
                        messageResponse.setStatusCode(400);
                        messageResponse.setCode(`auth/${error.code.toString()}`);
                        messageResponse.setContent("Fail send code.");
                        return res.send({
                            message: messageResponse.toJSON(),
                            statusCode: 400,
                            code: `auth/${error.code.toString()}`,
                            timestamp
                        });
                    });
            }

            if (cusEmail) {
                const match = await bcrypt.compare(password, cusEmail.password);
                if (!match) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode(`auth/incorrect-password`);
                    messageResponse.setContent("Incorrect password.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "auth/incorrect-password",
                        timestamp
                    });
                }
                if (cusEmail.status !== "Has been activated") {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode(`auth/no-verify`);
                    messageResponse.setContent("Your account has not been activated or has been locked, please contact Email: datnstech@gmail.com for help.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "auth/no-verify",
                        timestamp
                    });
                }
                let otp = await OTPService.sendOTPByEmail(cusEmail.email);
                if (otp === 0) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode(`auth/verify-failed`);
                    messageResponse.setContent("Verify customer failed.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "auth/verify-failed",
                        timestamp
                    });
                } else {
                    cusEmail.otp = otp;
                    await cusEmail.save();
                    cusEmail.password = password;

                    messageResponse.setStatusCode(200);
                    messageResponse.getCode("auth/verify");
                    messageResponse.setContent("Please verify your account");
                    return res.send({
                        message: messageResponse.toJSON(),
                        id: cusEmail._id,
                        customer: cusEmail,
                        statusCode: 200,
                        code: "auth/verify",
                        timestamp
                    });
                }
            }
        } catch (e) {
            console.log("=========login=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.getCode(`auth/login-failed`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/login-failed`,
                timestamp
            });
        }
    }

    checkLogin = async (req, res) => {
        let email = req.body.email;
        let phoneNumer = req.body.phone_number;
        let password = req.body.password;
        const token = req.header('Authorization');
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (email === undefined || email.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-email");
            messageResponse.setContent("email require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-email", timestamp });
        }
        if (password === undefined || password.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-password");
            messageResponse.setContent("password require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-password", timestamp });
        }
        if (token === undefined || token.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-token");
            messageResponse.setContent("token require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-token", timestamp });
        }

        try {
            let cusEmail = await CustomerModel.customerModel.findOne({ email: email });
            if (cusEmail) {
                const match = await bcrypt.compare(password, cusEmail.password);
                if (match) {
                    let authToken = await AuthTokenModel.authTokenModel.findOne({ customer_id: cusEmail._id });
                    if (authToken && authToken.token === token) {
                        messageResponse.setStatusCode(200);
                        messageResponse.setCode(`auth/200`);
                        messageResponse.setContent("Check success.");
                        return res.send({
                            message: messageResponse.toJSON(),
                            statusCode: 200,
                            code: `auth/200`,
                            timestamp
                        });
                    }
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode(`auth/wrong-token`);
                    messageResponse.setContent("wrong token");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: `auth/wrong-token`,
                        timestamp
                    });
                }
                else {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode(`auth/wrong-pass`);
                    messageResponse.setContent("wrong password");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: `auth/wrong-pass`,
                        timestamp
                    });
                }
            }
            else {
                messageResponse.setStatusCode(400);
                messageResponse.setCode(`auth/account-notexists`);
                messageResponse.setContent("Not exists");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: `auth/account-notexists`,
                    timestamp
                });
            }
        } catch (e) {
            console.log("=========checkLogin=========");
            console.log(e.message.toString());
            messageResponse.setCode(`auth/check-login-failed`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: `auth/check-login-failed`,
                timestamp
            });
        }
    }

    verifyLogin = async (req, res) => {
        const customerID = req.body._id;
        const password = req.body.password;
        const otp = req.body.otp;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);


        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-customerid");
            messageResponse.setContent("customerID require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (password === undefined || password.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-password");
            messageResponse.setContent("password require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-password", timestamp });
        }
        if (otp === undefined || otp.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-otp");
            messageResponse.setContent("otp require");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-otp", timestamp });
        }
        try {
            let customer = await CustomerModel.customerModel.findOne({ _id: customerID, otp: otp })
            if (customer) {
                // ms('2 days')  // 172800000
                // ms('1d')      // 86400000
                // ms('10h')     // 36000000
                // ms('2.5 hrs') // 9000000
                // ms('2h')      // 7200000
                // ms('1m')      // 60000
                // ms('5s')      // 5000
                let token = jwt.sign({ customer: customer }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: "10h",
                });
                let currentAuthToken = await AuthTokenModel.authTokenModel.findOne({ customer_id: customer._id }).lean();
                if (currentAuthToken) {
                    const filterAuthToken = {
                        customer_id: customer._id
                    };
                    const updateAuthToken = { token: token, created_at: timestamp };
                    await AuthTokenModel.authTokenModel.findOneAndUpdate(filterAuthToken, updateAuthToken).lean();
                }
                else {
                    let authToken = new AuthTokenModel.authTokenModel({
                        customer_id: customer._id,
                        token,
                        created_at: timestamp,
                    });
                    await authToken.save();
                }
                customer.otp = null;
                await customer.save();
                customer.password = password;

                messageResponse.setStatusCode(200);
                messageResponse.setCode(`auth/login-success`);
                messageResponse.setContent("Login success.");
                return res.send({
                    customer: customer,
                    token: token,
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: `auth/login-success`,
                    timestamp
                });
            } else {
                messageResponse.setStatusCode(400);
                messageResponse.setCode(`auth/wrong-otp`);
                messageResponse.setContent("otp wrong.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: `auth/wrong-otp`,
                    timestamp
                });
            }
        } catch (e) {
            console.log("===========verifyLogin===========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode(`auth/verify-failed`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/verify-failed`,
                timestamp
            });
        }
    }

    addFCM = async (req, res) => {
        let customerID = req.body._id;
        let fcm = req.body.fcm;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (fcm === undefined || fcm.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-fcm");
            messageResponse.setContent("Missing fcm");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-fcm", timestamp });
        }

        try {
            let cus = await CustomerModel.customerModel.findById(customerID);
            if (!cus) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode(`auth/customer-notfound`);
                messageResponse.setContent("Customer not found.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: `auth/customer-notfound`,
                    timestamp
                });
            }
            cus.fcm = fcm;
            await cus.save();

            messageResponse.setStatusCode(200);
            messageResponse.setCode(`auth/add-fcm-success`);
            messageResponse.setContent("Đăng nhập thành công");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: `auth/add-fcm-success`,
                timestamp
            });
        } catch (e) {
            console.log("==========addFCM==========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode(`auth/add-fcm-failed`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/add-fcm-failed`,
                timestamp
            })
        }
    }

    logout = async (req, res) => {
        const customerID = req.body.customerID;
        const token = req.header('Authorization');

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (token === undefined || token.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/missing-token");
            messageResponse.setContent("Missing token");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "auth/missing-token", timestamp });
        }

        try {
            const filter = {
                customer_id: customerID,
                token: token
            };

            let authToken = await AuthTokenModel.authTokenModel.findOneAndDelete(filter).lean();
            if (!authToken) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("auth/delete-failed");
                messageResponse.setContent(`error delete token with customerID: ${customerID}`);
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "auth/delete-failed",
                    timestamp
                });
            }
            // console.log(authToken);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("auth/delete-success");
            messageResponse.setContent(`logout success at: ${timestamp}`);
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "auth/delete-success",
                timestamp
            });
        } catch (e) {
            console.log("==========logout==========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode(`auth/logout-failed`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/logout-failed`,
                timestamp
            });
        }
    }

}

module.exports = new CustomerService;

