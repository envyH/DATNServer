const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const ProductModel = require('../models/model.product');

class ProductService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {

            let product = await ProductModel.productModel.find().lean();
            return res.send({
                message: "get list product success",
                statusCode: 200,
                code: "product/get-success",
                products: product,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "product/get-failed",
                timestamp
            });
        }
    }

    getDetail = async (req, res) => {
        const customerID = req.body.customerID;
        const productID = req.body.productID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.trim().length == 0) {
            return res.send({ message: "Missing productID", statusCode: 400, code: "auth/missing-productid", timestamp });
        }

        try {
            let data = [];
            let product = await ProductModel.productModel.findById(productID).lean();
            data.push(product);
            return res.send({
                message: "get detail product success",
                statusCode: 200,
                code: "product/get-success",
                products: data,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "product/get-failed",
                timestamp
            });
        }
    }


}

module.exports = new ProductService;