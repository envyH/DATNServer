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
const { sortObject } = require('../utils/order');
const { title } = require('process');



let mCustomerID;
let mProductOrders;

const getProductCart = async (customerID, messageResponseID, timestamp) => {
    const filterCart = {
        customer_id: customerID,
        status: STATUS_CART.SELECTED.value
    }
    let carts = await CartModel.cartModel.find(filterCart).lean();
    let dataProduct = [];

    let messageResponse = new MessageResponses();
    messageResponse.setId(messageResponseID);
    messageResponse.setCreatedAt(timestamp);

    await Promise.all(
        carts.map(async (cart) => {
            try {
                let prodductInfo = await ProductModel.productModel.findById(cart.product_id).lean();
                dataProduct.push(prodductInfo);
            } catch (e) {
                console.log("=======getProductCart=========");
                console.log(e.message.toString());
                messageResponse.setStatusCode(400);
                messageResponse.setCode("order/getproductinfo-failed");
                messageResponse.setContent(e.message.toString());
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "order/getproductinfo-failed",
                    timestamp
                });
            }
        })
    );
    let mData = [];
    for (let cart of carts) {
        let productInfo = dataProduct.find(product => product._id.toString() === cart.product_id.toString());
        let quantityCart = cart.quantity;
        if (cart.status === STATUS_CART.SELECTED.value) {
            let dataResponse = {
                _id: cart._id,
                product_id: productInfo._id,
                name: productInfo.name,
                image: productInfo.img_cover,
                quantity_product: productInfo.quantity,
                quantity_cart: quantityCart,
                price: productInfo.price,
                note: cart.note,
                status_cart: cart.status,
                status_product: productInfo.status,
                created_at: cart.created_at,
            }
            mData.push(dataResponse);
        }
    }
    return mData;
}

const mGetAmountZaloPay = async (req, res, productOrders, messageResponse, timestamp) => {
    try {
        if (productOrders.length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/no product order");
            messageResponse.setContent("No product order.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/no product order",
                timestamp
            });
        }
        let sum = 0;
        await Promise.all(
            productOrders.map(async (productOrder) => {
                let priceOne = productOrder.price;
                sum += priceOne * parseInt(productOrder.quantity_cart);
            })
        );
        messageResponse.setStatusCode(200);
        messageResponse.setCode("order/get-amount-zalopay-success");
        messageResponse.setContent("Create order success.");
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 200,
            amount: sum,
            code: "order/get-amount-zalopay-success",
            timestamp
        });
    } catch (e) {
        console.log("=======mGetAmountZaloPay=======");
        console.log(e.message.toString());
        messageResponse.setStatusCode(400);
        messageResponse.setCode("order/get-amount-zalopay-failed");
        messageResponse.setContent(e.message.toString());
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 400,
            code: "order/get-amount-zalopay-failed",
            timestamp
        });
    }
}
const mCreateOrderZaloPay = async (req, res, customerID, productOrders, messageResponse, timestamp) => {
    try {
        let totalAmount = 0;
        let productLimit = [];
        await Promise.all(
            productOrders.map(async (productOrder) => {
                if (parseInt(productOrder.quantity_cart) > parseInt(productOrder.quantity_product)) {
                    productLimit.push(productOrder.product_id);
                }
            })
        );

        if (productLimit.length > 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/product-quantity-exceeds-the-limit");
            messageResponse.setContent("Product quantity exceeds the limit.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/product-quantity-exceeds-the-limit",
                timestamp
            });
        }

        let order = new OrderModel.orderModel({
            customer_id: customerID,
            payment_methods: PAYMENT_METHOD.ZALO_PAY.value,
            created_at: timestamp,
        });

        let product;
        await Promise.all(productOrders.map(async productOrder => {
            let detailOrder = new OrderDetailModel.orderDetailModel({
                order_id: order._id,
                product_id: productOrder.product_id,
                quantity: productOrder.quantity_cart,
            });
            product = await ProductModel.productModel.findById(productOrder.product_id);
            let newQuantityProduct = parseInt(product.quantity) - parseInt(productOrder.quantity_cart);
            product.quantity = newQuantityProduct;
            if (newQuantityProduct === 0) {
                product.status = STATUS_PRODUCT.OUT_OF_STOCK.value;
            }
            product.sold = parseInt(product.sold) + parseInt(productOrder.quantity_cart);
            totalAmount += parseInt(productOrder.quantity_cart) * parseInt(product.price);
            await product.save();
            await detailOrder.save();
            await CartModel.cartModel.findByIdAndUpdate(productOrder._id, { status: STATUS_CART.BOUGHT.value });
        }));
        // TODO fix save not enough order
        order.amount = totalAmount;
        await order.save();

        let customer = await CustomerModel.customerModel.findById(customerID);
        let imageProduct = product.img_cover;
        let title = "Đặt đơn hàng";
        let message = `Bạn đã đặt một đơn hàng vào lúc ${timestamp} phương thức thanh toán ZALOPAY với mã đơn hàng ${order._id}`;
        await NotificationService.createNotification(title, message, imageProduct, customer.fcm, PAYMENT_METHOD.ZALO_PAY.value);
        messageResponse.setStatusCode(200);
        messageResponse.setCode("order/create-order-zalopay-success");
        messageResponse.setTitle(title);
        messageResponse.setContent(message);
        messageResponse.setImage(imageProduct);
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 200,
            code: "order/create-order-zalopay-success",
            timestamp
        });
    } catch (e) {
        console.log("=========mCreateOrderZaloPay===========");
        console.log(e.message.toString());
        console.log(e.code.toString());
        messageResponse.setStatusCode(400);
        messageResponse.setCode("order/create-order-zalopay-failed");
        messageResponse.setContent(e.message.toString());
        return res.send({
            message: e.message.toString(),
            statusCode: 400,
            code: "order/create-order-zalopay-failed",
            timestamp
        });
    }
}

const mCreatePaymentURL = async (req, res, customerID, productOrders, timestamp, urlReturn) => {
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');

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

    process.env.TZ = specificTimeZone;

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = urlReturn;
    let orderId = moment(date).format('DDHHmmss');
    // TODO body
    try {
        let totalAmount = 0;
        if (productOrders.length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/no product order");
            messageResponse.setContent("No product order.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/no product order",
                timestamp
            });
        }
        mProductOrders = productOrders;
        let productLimit = [];
        await Promise.all(
            productOrders.map(async (productOrder) => {
                if (parseInt(productOrder.quantity_cart) > parseInt(productOrder.quantity_product)) {
                    productLimit.push(productOrder.product_id);
                }
            })
        );

        if (productLimit.length > 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/product-quantity-exceeds-the-limit");
            messageResponse.setContent("Product quantity exceeds the limit.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/product-quantity-exceeds-the-limit",
                timestamp
            });
        }

        await Promise.all(productOrders.map(async productOrder => {
            let product = await ProductModel.productModel.findById(productOrder.product_id);
            totalAmount = parseInt(productOrder.quantity_cart) * parseInt(product.price);
        }));
        let bankCode = req.body.bankCode;
        let locale = req.body.language;

        if (locale === null || locale === '') {
            locale = 'vn';
        }
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = parseInt(totalAmount) * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        mCustomerID = customerID;
        messageResponse.setStatusCode(200);
        messageResponse.setCode("order/get-payment-url-success");
        messageResponse.setContent("Get paymetn url success.");
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 200,
            code: "order/get-payment-URL-success",
            paymentURL: vnpUrl,
            timestamp: timestamp
        });
    } catch (e) {
        console.log("======mCreatePaymentURL=========");
        console.log(e.message.toString());
        console.log(e.code.toString());
        messageResponse.setStatusCode(400);
        messageResponse.setCode("order/get-payment-url-failed");
        messageResponse.setContent(e.message.toString());
        return res.send({
            message: messageResponse.toJSON(),
            statusCode: 400,
            code: "order/get-payment-URL-failed",
            timestamp
        });
    }
}

const mVnpReturn = async (req, res, productOrders, type) => {
    let date = new Date();
    let timestamp = moment(date).tz(specificTimeZone).format(formatType);
    let vnp_Params = req.query;

    let messageResponse = new MessageResponses();
    const id = uuidv4();
    messageResponse.setId(id);
    messageResponse.setCreatedAt(timestamp);

    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
    const ipAddress = process.env.URL;
    // const ipAddress = process.env.URLDev;
    // const portLocal = process.env.POST;
    // const ipLocal = process.env.IP_LOCAL;
    // const ipAddress = `http://${ipLocal}:${portLocal}`;
    if (secureHash === signed) {
        //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
        // TODO https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr&refund.html
        let code = vnp_Params['vnp_ResponseCode'];
        if (code == "00") {
            // TODO update product, cart,...
            try {
                let totalAmount = 0;
                if (!productOrders) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("order/cannot-load-product-cart");
                    messageResponse.setContent("Cannot load product cart.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "order/cannot-load-product-cart",
                        timestamp
                    });
                }
                let productLimit = [];
                await Promise.all(
                    productOrders.map(async (productOrder) => {
                        if (parseInt(productOrder.quantity_cart) > parseInt(productOrder.quantity_product)) {
                            productLimit.push(productOrder.product_id);
                        }
                    })
                );

                if (productLimit.length > 0) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("order/product-quantity-exceeds-the-limit");
                    messageResponse.setContent("Product quantity exceeds the limit.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "order/product-quantity-exceeds-the-limit",
                        timestamp
                    });
                }

                let order = new OrderModel.orderModel({
                    customer_id: mCustomerID,
                    payment_methods: PAYMENT_METHOD.E_BANKING.value,
                    created_at: timestamp,
                });
                let product;
                await Promise.all(productOrders.map(async productOrder => {
                    let detailOrder = new OrderDetailModel.orderDetailModel({
                        order_id: order._id,
                        product_id: productOrder.product_id,
                        quantity: productOrder.quantity_cart,
                    });
                    product = await ProductModel.productModel.findById(productOrder.product_id);
                    let newQuantityProduct = parseInt(product.quantity) - parseInt(productOrder.quantity_cart);
                    product.quantity = newQuantityProduct;
                    if (newQuantityProduct === 0) {
                        product.status = STATUS_PRODUCT.OUT_OF_STOCK.value;
                    }
                    product.sold = parseInt(product.sold) + parseInt(productOrder.quantity_cart);
                    totalAmount = parseInt(productOrder.quantity_cart) * parseInt(product.price);
                    await product.save();
                    await detailOrder.save();
                    if (type === STATUS_BUY.IN_CART.value) {
                        await CartModel.cartModel.findByIdAndUpdate(productOrder._id, { status: STATUS_CART.BOUGHT.value });
                    }
                }));
                order.amount = totalAmount;
                await order.save();

                let customer = await CustomerModel.customerModel.findById(mCustomerID);
                let title = "Đặt đơn hàng";
                let content = `Bạn đã đặt một đơn hàng vào lúc ${timestamp} phương thức thanh toán E-Banking với mã đơn hàng ${order._id}`;
                let imageProduct = product.img_cover;
                await NotificationService.createNotification(title, content, imageProduct, customer.fcm, PAYMENT_METHOD.E_BANKING.value);
                return res.redirect(`${ipAddress}/v1/api/order/paySuccess`);
            } catch (e) {
                console.log("===========mVnpayReturn==========");
                console.log(e.message.toString());
                console.log(e.toString());
                return res.redirect(`${ipAddress}/v1/api/order/payFail`);
            }
        } else {
            console.log("===========vnpayReturn1==========");
            return res.redirect(`${ipAddress}/v1/api/order/payFail`);
        }
    } else {
        console.log("===========vnpayReturn2==========");
        return res.redirect(`${ipAddress}/v1/api/order/payFail`);
    }
}

class OrderService {
    getAmountZaloPay = async (req, res) => {
        const customerID = req.body.customerID;
        const type = req.body.type;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const messageResponseID = uuidv4();
        messageResponse.setId(messageResponseID);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-customerid", timestamp });
        }
        if (type === undefined) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-type");
            messageResponse.setContent("Missing type");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-type", timestamp });
        }
        let isNumberType = isNumber(type);
        if (!isNumberType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/type-nan");
            messageResponse.setContent("type not a number.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                productCarts: [],
                code: "order/type-nan",
                timestamp
            });
        }

        let typeValue = parseInt(type)
        let isValidType = checkPaymentMethod(typeValue);
        if (!isValidType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/payment-method-invalid-value");
            messageResponse.setContent("payment method invalid value.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/payment-method-invalid-value",
                timestamp
            });
        }

        try {
            let productOrders = await getProductCart(customerID, messageResponseID, timestamp);
            await mGetAmountZaloPay(req, res, productOrders, messageResponse, timestamp);
        } catch (e) {
            console.log("=======getAmountZaloPay=======");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-amount-zalopay-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-amount-zalopay-failed",
                timestamp
            });
        }
    }

    getAmountZaloPayNow = async (req, res) => {
        const customerID = req.body.customerID;
        const type = req.body.type;
        const productCarts = req.body.productCarts;
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
        if (productCarts === undefined || productCarts.length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-productcarts");
            messageResponse.setContent("Missing productCarts");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-productcarts", timestamp });
        }
        if (type === undefined) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-type");
            messageResponse.setContent("Missing type");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-type", timestamp });
        }
        let isNumberType = isNumber(type);
        if (!isNumberType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/type-nan");
            messageResponse.setContent("type not a number.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                productCarts: [],
                code: "order/type-nan",
                timestamp
            });
        }

        let typeValue = parseInt(type)
        let isValidType = checkPaymentMethod(typeValue);
        if (!isValidType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/payment-method-invalid-value");
            messageResponse.setContent("Payment method invalid value.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/payment-method-invalid-value",
                timestamp
            });
        }

        try {
            await mGetAmountZaloPay(req, res, productCarts, messageResponse, timestamp);
        } catch (e) {
            console.log("=========getAmountZaloPayNow===========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-amount-zalopay-now-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-amount-zalopay-now-failed",
                timestamp
            });
        }
    }

    createOrderZaloPay = async (req, res) => {
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
            let productOrders = await getProductCart(customerID, id, timestamp);
            await mCreateOrderZaloPay(req, res, customerID, productOrders, messageResponse, timestamp);
        } catch (e) {
            console.log("=========createOrderZaloPay===========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/create-order-zalopay-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "order/create-order-zalopay-failed",
                timestamp
            });
        }
    }

    createOrderZaloPayNow = async (req, res) => {
        const customerID = req.body.customerID;
        const productOrders = req.body.productCarts;

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
        if (productOrders === undefined || productOrders.length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-productorders");
            messageResponse.setContent("Missing productOrders");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-productorders", timestamp });
        }

        try {
            await mCreateOrderZaloPay(req, res, customerID, productOrders, messageResponse, timestamp);
        } catch (e) {
            console.log("=========createOrderZaloPayNow============");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/create-order-zalopay-now-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/create-order-zalopay-now-failed",
                timestamp
            });
        }
    }

    // TODO VNPay
    createPaymentURL = async (req, res) => {
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
            let returnUrl = process.env.VNP_ReturnUrl;
            // let returnUrl = process.env.VNP_ReturnUrlDev;
            let productOrders = await getProductCart(customerID, id, timestamp);
            await mCreatePaymentURL(req, res, customerID, productOrders, timestamp, returnUrl);
        } catch (e) {
            console.log("======createPaymentURL=========");
            console.log(e);
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-payment-url-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-payment-URL-failed",
                timestamp
            });
        }
    }

    createPaymentURLNow = async (req, res) => {
        const customerID = req.body.customerID;
        const productID = req.body.productID;
        const quantityProduct = req.body.quantityProduct;
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
        if (productID === undefined || productID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-productid");
            messageResponse.setContent("Missing productID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-productid", timestamp });
        }
        if (quantityProduct === undefined || parseInt(quantityProduct) == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-quantity");
            messageResponse.setContent("Missing quantityProduct");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "order/missing-quantity", timestamp });
        }

        let isNumberType = isNumber(quantityProduct);
        if (!isNumberType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/quantity-nan");
            messageResponse.setContent("Quantity not a number.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/quantity-nan",
                timestamp
            });
        }
        let quantityValue = parseInt(quantityProduct);
        if (quantityValue <= 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/quantity-min-is-1");
            messageResponse.setContent("Minimum quantity is 1.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/quantity-min-is-1",
                timestamp
            });
        }

        try {
            let productOrders = [];
            let dataProduct = await ProductModel.productModel.findById(productID).lean();
            if (dataProduct) {
                if (quantityValue > parseInt(dataProduct.quantity)) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("order/quantity-exceeds-limit");
                    messageResponse.setContent("Quantity exceeds the limit.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "order/quantity-exceeds-limit",
                        timestamp
                    });
                }
                let dataResponse = {
                    _id: id,
                    product_id: dataProduct._id,
                    name: dataProduct.name,
                    image: dataProduct.img_cover,
                    quantity_product: dataProduct.quantity,
                    quantity_cart: quantityValue,
                    price: dataProduct.price,
                    note: "",
                    status_product: dataProduct.status,
                    created_at: timestamp,
                }
                productOrders.push(dataResponse);
                let returnUrl = process.env.VNP_ReturnUrlNow;
                // let returnUrl = process.env.VNP_ReturnUrlDevNow;
                await mCreatePaymentURL(req, res, customerID, productOrders, timestamp, returnUrl);
            }
            else {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("order/product-not-exist");
                messageResponse.setContent("Product not exits.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "order/product-not-exist",
                    timestamp
                });
            }
        } catch (e) {
            console.log("======createPaymentURLNow=========");
            console.log(e);
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/get-payment-url-now-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "order/get-payment-URL-now-failed",
                timestamp
            });
        }
    }

    vnpayReturn = async (req, res) => {
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);
        const ipAddress = process.env.URL;
        // const ipAddress = process.env.URLDev;
        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);
        try {
            let productOrders = await getProductCart(mCustomerID, id, timestamp);
            if (productOrders.length == 0) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("order/cannot-load-product-cart");
                messageResponse.setContent("Cannot load product cart.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "order/cannot-load-product-cart",
                    timestamp
                });
            }
            await mVnpReturn(req, res, productOrders, STATUS_BUY.IN_CART.value);
        } catch (e) {
            console.log("===========vnpayReturn==========");
            console.log(e.message.toString());
            console.log(e.toString());
            return res.redirect(`${ipAddress}/v1/api/order/payFail`);
        }
    }

    vnpayReturnNow = async (req, res) => {
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);
        const ipAddress = process.env.URL;
        // const ipAddress = process.env.URLDev;
        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);
        try {
            await mVnpReturn(req, res, mProductOrders, STATUS_BUY.NOW.value);
        } catch (e) {
            console.log("===========vnpayReturnNow==========");
            console.log(e.message.toString());
            console.log(e.toString());
            return res.redirect(`${ipAddress}/v1/api/order/payFail`);
        }
    }

    vnpayIPN = async (req, res) => {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        let vnp_HashSecret = process.env.vnp_HashSecret;
        let secretKey = vnp_HashSecret;
        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        let paymentStatus = '0'; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
        //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
        //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

        let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
        let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
        if (secureHash === signed) { //kiểm tra checksum
            if (checkOrderId) {
                if (checkAmount) {
                    if (paymentStatus == "0") { //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
                        if (rspCode == "00") {
                            //thanh cong
                            //paymentStatus = '1'
                            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
                            res.status(200).json({ RspCode: '00', Message: 'Success' })
                        }
                        else {
                            //that bai
                            //paymentStatus = '2'
                            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
                            res.status(200).json({ RspCode: '00', Message: 'Success' })
                        }
                    }
                    else {
                        res.status(200).json({ RspCode: '02', Message: 'This order has been updated to the payment status' })
                    }
                }
                else {
                    res.status(200).json({ RspCode: '04', Message: 'Amount invalid' })
                }
            }
            else {
                res.status(200).json({ RspCode: '01', Message: 'Order not found' })
            }
        }
        else {
            res.status(200).json({ RspCode: '97', Message: 'Checksum failed' })
        }
    }

    queryDR = async (req, res) => {
        process.env.TZ = specificTimeZone;
        let date = new Date();

        let crypto = require("crypto");

        let vnp_TmnCode = process.env.vnp_TmnCode;
        let secretKey = process.env.vnp_HashSecret;
        let vnp_Api = process.env.VNP_API;

        let vnp_TxnRef = req.body.orderId;
        let vnp_TransactionDate = req.body.transDate;

        let vnp_RequestId = moment(date).format('HHmmss');
        let vnp_Version = '2.1.0';
        let vnp_Command = 'querydr';
        let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef;

        let vnp_IpAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let currCode = 'VND';
        let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

        let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TxnRef + "|" + vnp_TransactionDate + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;

        let hmac = crypto.createHmac("sha512", secretKey);
        let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest("hex");

        let dataObj = {
            'vnp_RequestId': vnp_RequestId,
            'vnp_Version': vnp_Version,
            'vnp_Command': vnp_Command,
            'vnp_TmnCode': vnp_TmnCode,
            'vnp_TxnRef': vnp_TxnRef,
            'vnp_OrderInfo': vnp_OrderInfo,
            'vnp_TransactionDate': vnp_TransactionDate,
            'vnp_CreateDate': vnp_CreateDate,
            'vnp_IpAddr': vnp_IpAddr,
            'vnp_SecureHash': vnp_SecureHash
        };
        // /merchant_webapi/api/transaction
        request({
            url: vnp_Api,
            method: "POST",
            json: true,
            body: dataObj
        }, function (error, response, body) {
            console.log(response);
        });
    }

    refund = async (req, res) => {
        process.env.TZ = specificTimeZone;
        let date = new Date();

        let crypto = require("crypto");

        let vnp_TmnCode = process.env.vnp_TmnCode;
        let secretKey = process.env.vnp_HashSecret;
        let vnp_Api = process.env.VNP_API;

        let vnp_TxnRef = req.body.orderId;
        let vnp_TransactionDate = req.body.transDate;
        let vnp_Amount = req.body.amount * 100;
        let vnp_TransactionType = req.body.transType;
        let vnp_CreateBy = req.body.user;

        let currCode = 'VND';

        let vnp_RequestId = moment(date).format('HHmmss');
        let vnp_Version = '2.1.0';
        let vnp_Command = 'refund';
        let vnp_OrderInfo = 'Hoan tien GD ma:' + vnp_TxnRef;

        let vnp_IpAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;


        let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

        let vnp_TransactionNo = '0';

        let data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TransactionType + "|" + vnp_TxnRef + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + vnp_TransactionDate + "|" + vnp_CreateBy + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo;
        let hmac = crypto.createHmac("sha512", secretKey);
        let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest("hex");

        let dataObj = {
            'vnp_RequestId': vnp_RequestId,
            'vnp_Version': vnp_Version,
            'vnp_Command': vnp_Command,
            'vnp_TmnCode': vnp_TmnCode,
            'vnp_TransactionType': vnp_TransactionType,
            'vnp_TxnRef': vnp_TxnRef,
            'vnp_Amount': vnp_Amount,
            'vnp_TransactionNo': vnp_TransactionNo,
            'vnp_CreateBy': vnp_CreateBy,
            'vnp_OrderInfo': vnp_OrderInfo,
            'vnp_TransactionDate': vnp_TransactionDate,
            'vnp_CreateDate': vnp_CreateDate,
            'vnp_IpAddr': vnp_IpAddr,
            'vnp_SecureHash': vnp_SecureHash
        };

        request({
            url: vnp_Api,
            method: "POST",
            json: true,
            body: dataObj
        }, function (error, response, body) {
            console.log(response);
        });
    }


}

module.exports = new OrderService;