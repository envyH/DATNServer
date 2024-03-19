const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { ProductModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class ProductService {

    getList = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }

        try {
            let product = await ProductModel.productModel.find().lean();
            let messageResponse = new MessageResponses();
            const id = uuidv4();
            messageResponse.setId(id);
            messageResponse.setStatusCode(200);
            messageResponse.setContent("get list product success");
            messageResponse.setCreatedAt(timestamp);
            console.log(messageResponse.getContent());
            return res.send({
                message: messageResponse,
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

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.toString().trim().length == 0) {
            return res.send({ message: "Missing productID", statusCode: 400, code: "auth/missing-productid", timestamp });
        }

        try {
            let data = [];
            let product = await ProductModel.productModel.findById(productID).lean();
            data.push(product);
            let messageResponse = new MessageResponses();
            const id = uuidv4();
            messageResponse.setId(id);
            messageResponse.setStatusCode(200);
            messageResponse.setContent("get list product success");
            messageResponse.setCreatedAt(timestamp);
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "product/get-detail-success",
                products: data,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "product/get-detail-failed",
                timestamp
            });
        }
    }

    getListByCateID = async (req, res) => {
        const customerID = req.body.customerID;
        const categoryID = req.body.categoryID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "Missing customerID", statusCode: 400, code: "auth/missing-customerid", timestamp });
        }
        if (categoryID === undefined || categoryID.toString().trim().length == 0) {
            return res.send({ message: "Missing categoryID", statusCode: 400, code: "auth/missing-categorytid", timestamp });
        }

        try {
            let product = await ProductModel.productModel.find({ category_id: categoryID }).lean();
            return res.send({
                message: "get list product success",
                statusCode: 200,
                code: "product/get-list-success",
                products: product,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "product/get-by-cateid-failed",
                timestamp
            });
        }
    }


}

module.exports = new ProductService;
