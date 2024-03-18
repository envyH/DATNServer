const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('./firebase');

const { AuthTokenModel } = require('../models');


class AuthTokenService {
    create = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {
            return res.send({
                message: customerID,
                statusCode: 200,
                code: "auth/create-success",
                timestamp
            });
        } catch (e) {
            console.log(`auth.token service: create: ${e.message}`);
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

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {
            const filter = {
                customer_id: customerID,
            };

            let authToken = await AuthTokenModel.authTokenModel.findOne(filter).lean();
            if (!authToken) {
                return res.send({
                    message: `error delete token with customerID: ${customerID}`,
                    statusCode: 400,
                    code: "auth/delete-failed",
                    timestamp
                });
            }
            console.log(authToken);
            return res.send({
                message: authToken.created_at,
                statusCode: 200,
                code: "auth/delete-success",
                timestamp
            });
        } catch (e) {
            console.log(`auth.token service: delete: ${e.message}`);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "auth/create-failed",
                timestamp
            });
        }
    }


}

module.exports = new AuthTokenService;
