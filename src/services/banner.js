const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const BannerModel = require('../models/model.banner');

class BannerService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {

            let banner = await BannerModel.bannerModel.find().lean();
            return res.send({
                message: "get list banner success",
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