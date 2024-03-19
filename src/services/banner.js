const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { BannerModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class BannerService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {
            let banner = await BannerModel.bannerModel.find().lean();
            let messageResponse = new MessageResponses();
            const id = uuidv4();
            messageResponse.setId(id);
            messageResponse.setStatusCode(200);
            messageResponse.setContent("get list banner success");
            messageResponse.setCreatedAt(timestamp);
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "banner/get-success",
                banners: banner,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "banner/get-failed",
                timestamp
            });
        }
    }

}

module.exports = new BannerService;