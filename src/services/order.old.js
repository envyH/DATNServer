const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');
const NotificationService = require('../services/notification');

const { ProductModel, CartModel, OrderModel, OrderDetailModel, NotificationModel, CustomerModel } = require('../models');
const MessageResponses = require('../models/model.message.response');

const { isNumber } = require('../utils/index');
const { STATUS_CART } = require('../utils/cart');
const { STATUS_PRODUCT } = require('../utils/product');
const { checkPaymentMethod, PAYMENT_METHOD } = require('../utils/payment');
const { checkStatusBuy, STATUS_BUY } = require('../utils/buy');

const { admin } = require('../configs/firebase/index');
const { sortObject, STATUS_ORDER } = require('../utils/order');
const { title } = require('process');



let mCustomerID;
let mProductOrders;



const mGetProductOrder = async (res, dataOrder, messageResponseID, timestamp) => {
    let messageResponse = new MessageResponses();
    messageResponse.setId(messageResponseID);
    messageResponse.setCreatedAt(timestamp);

    let mDataDetailOrder = [];
    await Promise.all(
        dataOrder.map(async (order) => {
            try {
                let rawData = {
                    order_id: order._id,
                    created_at: order.created_at
                };
                let dataOrderDetail = await OrderDetailModel.orderDetailModel.find({ order_id: order._id }).lean();
                if (dataOrderDetail) {
                    let mProductID = [];
                    let mProductQuantity = [];
                    let mOrderDetailID = [];
                    for (let orderDetail of dataOrderDetail) {
                        let dataProduct = await ProductModel.productModel.findById(orderDetail.product_id).lean();
                        mProductID.push(dataProduct);
                        mProductQuantity.push(orderDetail.quantity);
                        mOrderDetailID.push(orderDetail._id);
                    }
                    rawData.products = mProductID;
                    rawData.productsQuantity = mProductQuantity;
                    rawData.orderDetailID = mOrderDetailID;
                    rawData.amount = order.amount;
                    mDataDetailOrder.push(rawData);
                }
            } catch (e) {
                console.log("=======mGetProductOrder=========");
                console.log(e.message.toString());
                messageResponse.setStatusCode(400);
                messageResponse.setCode("order/get-product-order-failed");
                messageResponse.setContent(e.message.toString());
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "order/get-product-order-failed",
                    timestamp
                });
            }
        })
    );

    return mDataDetailOrder;
}

const mGetProductOrderPlus = async (res, dataAllOrders, messageResponseID, timestamp) => {
    const dataProductOrders = {};
    const statuses = Object.values(STATUS_ORDER);
    const ordersKey = ["waitingList", "prepareList", "inTransitList", "paidList", "cancelList"]; // match client
    await Promise.all(statuses.map(async (status, i) => {
        const dataOrders = await mGetProductOrderWithStatus(res, dataAllOrders, messageResponseID, timestamp, status.value);
        dataProductOrders[ordersKey[i]] = dataOrders;
    }));
    return dataProductOrders;
}


const mGetProductOrderWithStatus = async (res, dataOrder, messageResponseID, timestamp, status) => {
    let messageResponse = new MessageResponses();
    messageResponse.setId(messageResponseID);
    messageResponse.setCreatedAt(timestamp);

    let mDataDetailOrder = [];
    await Promise.all(
        dataOrder.map(async (order) => {
            try {
                let rawData = {
                    order_id: order._id,
                    created_at: order.created_at
                };
                let dataOrderDetail = await OrderDetailModel.orderDetailModel.find({ order_id: order._id }).lean();
                if (dataOrderDetail) {
                    let mProduct = [];
                    let mProductQuantity = [];
                    let mOrderDetailID = [];
                    let mOrderDetailStatus = [];
                    let isSave = false;
                    for (let orderDetail of dataOrderDetail) {
                        if (status === orderDetail.status) {
                            let dataProduct = await ProductModel.productModel.findById(orderDetail.product_id).lean();
                            mProduct.push(dataProduct);
                            mProductQuantity.push(orderDetail.quantity);
                            mOrderDetailID.push(orderDetail._id);
                            mOrderDetailStatus.push(orderDetail.status);
                            isSave = true;
                        }
                    }
                    if (isSave) {
                        rawData.products = mProduct;
                        rawData.productsQuantity = mProductQuantity;
                        rawData.orderDetailID = mOrderDetailID;
                        rawData.orderDetailStatus = mOrderDetailStatus;
                        rawData.amount = order.amount;
                        mDataDetailOrder.push(rawData);
                    }
                }
            } catch (e) {
                console.log("=======mGetProductOrderPlus=========");
                console.log(e.message.toString());
                messageResponse.setStatusCode(400);
                messageResponse.setCode("order/get-product-order-failed");
                messageResponse.setContent(e.message.toString());
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "order/get-product-order-failed",
                    timestamp
                });
            }
        }
        )
    );

    return mDataDetailOrder;
}

class OrderService {

    getAllOrdersPlus = async (req, res) => {
        const customerID = req.body.customerID;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-customerid", timestamp });
        }

        try {
            const filters = {
                customer_id: customerID,
            };
            let dataAllOrders = await OrderModel.orderModel.find(filters).lean();
            const dataProductOrders = await mGetProductOrderPlus(res, dataAllOrders, id, timestamp);
            // const [
            //     dataOrderWaiting,
            //     dataOrderPrepare,
            //     dataOrderInTransit,
            //     dataOrderPaid,
            //     dataOrderCancel
            // ] = await Promise.all([
            //     mGetProductOrderPlus(res, dataAllOrders, id, timestamp, STATUS_ORDER.WAIT_CONFIRM.value),
            //     mGetProductOrderPlus(res, dataAllOrders, id, timestamp, STATUS_ORDER.PREPARE.value),
            //     mGetProductOrderPlus(res, dataAllOrders, id, timestamp, STATUS_ORDER.IN_TRANSIT.value),
            //     mGetProductOrderPlus(res, dataAllOrders, id, timestamp, STATUS_ORDER.PAID.value),
            //     mGetProductOrderPlus(res, dataAllOrders, id, timestamp, STATUS_ORDER.CANCEL.value)
            // ]);
            // const dataProductOrders = Object.fromEntries([
            //     ["waitingList", dataOrderWaiting],
            //     ["prepareList", dataOrderPrepare],
            //     ["inTransitList", dataOrderInTransit],
            //     ["paidList", dataOrderPaid],
            //     ["cancelList", dataOrderCancel]
            // ]);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("order/get-all-order-success");
            messageResponse.setContent("Get all order success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                ordersDetail: dataProductOrders,
                code: "order/get-all-order-success",
                timestamp
            });
        } catch (e) {
            console.log("=======getAllOrders=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-product-order-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-all-order-failed",
                timestamp
            });
        }
    }

    getAllOrders = async (req, res) => {
        const customerID = req.body.customerID;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-customerid", timestamp });
        }

        try {
            const filters = {
                customer_id: customerID,
                status: {
                    $in: [
                        STATUS_ORDER.WAIT_CONFIRM.value,
                        STATUS_ORDER.PREPARE.value,
                        STATUS_ORDER.IN_TRANSIT.value,
                        STATUS_ORDER.PAID.value,
                        STATUS_ORDER.CANCEL.value
                    ]
                }
            };

            let dataAllOrders = await OrderModel.orderModel.find(filters).lean();

            let dataOrderWaiting = dataAllOrders.filter(order => order.status === STATUS_ORDER.WAIT_CONFIRM.value);
            let dataOrderPrepare = dataAllOrders.filter(order => order.status === STATUS_ORDER.PREPARE.value);
            let dataOrderInTransit = dataAllOrders.filter(order => order.status === STATUS_ORDER.IN_TRANSIT.value);
            let dataOrderPaid = dataAllOrders.filter(order => order.status === STATUS_ORDER.PAID.value);
            let dataOrderCancel = dataAllOrders.filter(order => order.status === STATUS_ORDER.CANCEL.value);

            const orders = [dataOrderWaiting, dataOrderPrepare, dataOrderInTransit, dataOrderPaid, dataOrderCancel];
            const ordersKey = ["waitingList", "prepareList", "inTransitList", "paidList", "cancelList"]; // match client
            const dataProductOrders = {};
            for (let i = 0; i < orders.length; i++) {
                const dataProductOrder = await mGetProductOrder(res, orders[i], id, timestamp);
                dataProductOrders[ordersKey[i]] = dataProductOrder;
            }
            // console.log("===================");
            // console.log(dataProductOrders);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("order/get-all-order-success");
            messageResponse.setContent("Get all order success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                ordersDetail: dataProductOrders,
                code: "order/get-all-order-success",
                timestamp
            });
        } catch (e) {
            console.log("=======getAllOrders=========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-product-order-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-all-order-failed",
                timestamp
            });
        }
    }


}