const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('./firebase');

const { AuthTokenModel } = require('../models');
const MessageResponses = require('../models/model.message.response');

class AuthTokenService {
    create = async (req, res) => {
        const customerID = req.body.customerID;
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

        try {
            messageResponse.setStatusCode(200);
            messageResponse.setCode("auth/create-success");
            messageResponse.setContent("Create authToken success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "auth/create-success",
                timestamp
            });
        } catch (e) {
            console.log("========create=======");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("auth/create-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "auth/create-failed",
                timestamp
            });
        }
    }

    delete = async (req, res) => {
        const customerID = req.body.customerID;
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

        try {
            const filter = {
                customer_id: customerID,
            };

            let authToken = await AuthTokenModel.authTokenModel.findOne(filter).lean();
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
            console.log("=========delete==========");
            console.log(authToken);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("auth/delete-success");
            messageResponse.setContent(`delete authToken success: ${timestamp}`);
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "auth/delete-success",
                timestamp
            });
        } catch (e) {
            console.log("=========delete==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode(`auth/${e.code.toString()}`);
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: `auth/${e.code.toString()}`,
                timestamp
            });
        }
    }

}

module.exports = new AuthTokenService;
