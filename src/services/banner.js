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

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("banner/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "banner/missing-customerid", timestamp });
        }

        try {
            let banner = await BannerModel.bannerModel.find().lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("banner/get-success");
            messageResponse.setContent("get list banner success");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "banner/get-success",
                banners: banner,
                timestamp
            });
        } catch (e) {
            console.log("=========getList==========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("banner/get-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "banner/get-failed",
                timestamp
            });
        }
    }

}

module.exports = new BannerService;