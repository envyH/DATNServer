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

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-customerid", timestamp });
        }

        try {
            let product = await ProductModel.productModel.find().lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("product/get-success");
            messageResponse.setContent("Get list product success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "product/get-success",
                products: product,
                timestamp
            });
        } catch (e) {
            console.log("=========getList=========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/get-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
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

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-productid");
            messageResponse.setContent("Missing productID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-productid", timestamp });
        }

        try {
            let data = [];
            let product = await ProductModel.productModel.findById(productID).lean();
            data.push(product);

            messageResponse.setStatusCode(200);
            messageResponse.setCode("product/get-detail-success");
            messageResponse.setContent("Get list product success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "product/get-detail-success",
                products: data,
                timestamp
            });
        } catch (e) {
            console.log("=======getDetail==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/get-detail-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
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

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-customerid", timestamp });
        }
        if (categoryID === undefined || categoryID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-categorytid");
            messageResponse.setContent("Missing categoryID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-categorytid", timestamp });
        }

        try {
            let product = await ProductModel.productModel.find({ category_id: categoryID }).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("product/get-list-success");
            messageResponse.setContent("Get list product success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "product/get-list-success",
                products: product,
                timestamp
            });
        } catch (e) {
            console.log("========getListByCateID==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/get-by-cateid-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "product/get-by-cateid-failed",
                timestamp
            });
        }
    }

    searchByKeyword = async (req, res) => {
        const customerID = req.body.customerID;
        const keyword = req.body.keyword;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-customerid", timestamp });
        }
        if (keyword === undefined || keyword.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/missing-keyword");
            messageResponse.setContent("Missing keyword");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "product/missing-keyword", timestamp });
        }

        try {
            let regex = new RegExp(keyword);
            const filter = {
                name: { $regex: regex, $options: 'i' }
            };
            let product = await ProductModel.productModel.find(filter).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("product/search-success");
            messageResponse.setContent("Get product search success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "product/search-success",
                products: product,
                timestamp
            });
        } catch (e) {
            console.log("========searchByKeyword==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("product/search-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "product/search-failed",
                timestamp
            });
        }
    }


}

module.exports = new ProductService;
