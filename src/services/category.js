const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CategoryModel = require('../models/model.category');

class CategoryService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {

            let category = await CategoryModel.categoryModel.find().lean();
            return res.send({
                message: "get list category success",
                statusCode: 200,
                code: "category/get-success",
                categories: category,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "category/get-failed",
                timestamp
            });
        }
    }


}

module.exports = new CategoryService;