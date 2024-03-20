const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const FirebaseService = require('../services/firebase');

const { CartModel, ProductModel } = require('../models');
const MessageResponses = require('../models/model.message.response');

const { STATUS_CART, checkStatusInCart } = require('../utils/cart');
const { isNumber } = require('../utils/index');

const getProductCart = async (customerID, messageResponseID, timestamp) => {
    const filterCart = {
        customer_id: customerID,
        status: { $in: [STATUS_CART.DEFAULT.value, STATUS_CART.SELECTED.value] }
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
                messageResponse.setCode("cart/getproductinfo-failed");
                messageResponse.setContent(e.message.toString());
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "cart/getproductinfo-failed",
                    timestamp
                });
            }
        })
    );
    let mData = [];
    for (let cart of carts) {
        let productInfo = dataProduct.find(product => product._id.toString() === cart.product_id.toString());
        let quantityCart = cart.quantity;
        // TODO auto update when error
        // console.log(quantityCart);
        // console.log(productInfo.quantity);
        // if (quantityCart >= productInfo.quantity) {
        //     quantityCart = productInfo.quantity;
        //     try {
        //         await CartModel.cartModel.findByIdAndUpdate(cart._id, { quantity: quantityCart.toString() });
        //     } catch (e) {
        //         console.log(e.message);
        //         return res.send({
        //             message: e.message.toString(),
        //             statusCode: 400,
        //             code: "cart/auto-update-quanity-failed",
        //             timestamp
        //         });
        //     }
        // }
        if (cart.status === STATUS_CART.DEFAULT.value || cart.status === STATUS_CART.SELECTED.value) {
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

class CartService {
    addToCart = async (req, res) => {
        const customerID = req.body.customer_id;
        const productID = req.body.product_id;
        const mQuantity = req.body.quantity;
        const status = req.body.status; // first option
        const note = req.body.note; // option
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);


        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-productid");
            messageResponse.setContent("Missing productID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-productid", timestamp });
        }
        if (mQuantity === undefined || parseInt(mQuantity) == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-quantity");
            messageResponse.setContent("Missing quantity");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-quantity", timestamp });
        }

        try {
            const filter = {
                customer_id: customerID,
                product_id: productID,
                status: { $in: [STATUS_CART.DEFAULT.value, STATUS_CART.SELECTED.value] }
            };
            let product = await ProductModel.productModel.findById(productID);
            if (parseInt(product.quantity) <= 0) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("cart/product-is-temporarily-out-of-stock");
                messageResponse.setContent("The product is temporarily out of stock and cannot be ordered.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "cart/product-is-temporarily-out-of-stock",
                    timestamp
                });
            }
            let cart = await CartModel.cartModel.findOne(filter).lean();
            let newQuantity = 1;
            if (cart) {
                newQuantity = parseInt(cart.quantity) + parseInt(mQuantity);
                if (newQuantity > parseInt(product.quantity)) {
                    messageResponse.setStatusCode(400);
                    messageResponse.setCode("cart/update-quantity-failed");
                    messageResponse.setContent("Product quantity exceeds the limit.");
                    return res.send({
                        message: messageResponse.toJSON(),
                        statusCode: 400,
                        code: "cart/update-quantity-failed",
                        timestamp
                    });
                }
            }
            const update = { quantity: newQuantity };
            if (cart) {
                // TODO update quantity
                await CartModel.cartModel.findOneAndUpdate(filter, update);
                messageResponse.setStatusCode(200);
                messageResponse.setCode("cart/update-quantity-success");
                messageResponse.setContent("Update quantity success.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: "cart/update-quantity-success",
                    timestamp
                });
            }
            else {
                // TODO create
                let cart = new CartModel.cartModel({
                    customer_id: customerID,
                    product_id: productID,
                    quantity: mQuantity,
                    note: note,
                    created_at: timestamp,
                });
                await cart.save();

                messageResponse.setStatusCode(200);
                messageResponse.setCode("cart/add-success");
                messageResponse.setContent("add to cart success");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: "cart/add-success",
                    timestamp
                });
            }
        } catch (e) {
            console.log("========addToCart=========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/add-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/add-failed",
                timestamp
            });
        }
    }

    getByCustomerID = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        try {
            let mData = await getProductCart(customerID, id, timestamp);
            // console.log(mData);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("cart/getbycustomerid-success");
            messageResponse.setContent("Get data cart success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                productCarts: mData,
                code: "cart/getbycustomerid-success",
                timestamp
            });
        } catch (e) {
            console.log("========getByCustomerID==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/getbycustomerid-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/getbycustomerid-failed",
                timestamp
            });
        }
    }

    updateQuanity = async (req, res) => {
        let cartID = req.body.cartID;
        let customerID = req.body.customerID;
        let type = req.body.type;
        let mQuantity = req.body.quantity;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (cartID === undefined || cartID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-cartid");
            messageResponse.setContent("Missing cartID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-cartid", timestamp });
        }
        if (type === undefined || type.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-type");
            messageResponse.setContent("Missing type");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-type", timestamp });
        }
        if (mQuantity === undefined || parseInt(mQuantity) <= 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-quantity");
            messageResponse.setContent("Missing quantity");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-quantity", timestamp });
        }
        let isNumberType = isNumber(mQuantity);
        if (!isNumberType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/quantity-nan");
            messageResponse.setContent("Quantity not a number.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                productCarts: [],
                code: "cart/quantity-nan",
                timestamp
            });
        }
        let quantityValue = parseInt(mQuantity);
        try {
            let cartSelected = await CartModel.cartModel.findById(cartID).lean();
            let dataProduct = await ProductModel.productModel.findById(cartSelected.product_id);
            if (cartSelected) {
                let newQuantity = parseInt(cartSelected.quantity);
                if (type === "plus") {
                    if (newQuantity + quantityValue <= parseInt(dataProduct.quantity)) {
                        newQuantity += quantityValue;
                    } else {
                        messageResponse.setStatusCode(400);
                        messageResponse.setCode("cart/plus-not-change");
                        messageResponse.setContent("Plus not change.");
                        return res.send({
                            message: messageResponse.toJSON(),
                            statusCode: 400,
                            code: "cart/plus-not-change",
                            timestamp
                        });
                    }
                } else {
                    if (newQuantity > quantityValue) {
                        newQuantity -= quantityValue;
                    } else {
                        messageResponse.setStatusCode(400);
                        messageResponse.setCode("cart/minus-not-change");
                        messageResponse.setContent("Minus not change.");
                        return res.send({
                            message: messageResponse.toJSON(),
                            statusCode: 400,
                            code: "cart/minus-not-change",
                            timestamp
                        });
                    }
                }
                await CartModel.cartModel.findByIdAndUpdate(cartID, { quantity: newQuantity.toString() });
                let mData = await getProductCart(customerID, id, timestamp);
                messageResponse.setStatusCode(200);
                messageResponse.setCode("cart/update-quantity-success");
                messageResponse.setContent("Update quantity success.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    productCarts: mData,
                    code: "cart/update-quantity-success",
                    timestamp
                });
            }
        } catch (e) {
            console.log("========updateQuanity========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/update-quantity-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/update-quantity-failed",
                timestamp
            });
        }
    }

    updateStatus = async (req, res) => {
        let cartID = req.body.cartID;
        let customerID = req.body.customerID;
        let status = req.body.status;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (cartID === undefined || cartID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-cartid");
            messageResponse.setContent("Missing cartID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-cartid", timestamp });
        }
        if (status === undefined) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-status");
            messageResponse.setContent("Missing status");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-status", timestamp });
        }

        let isNumberType = isNumber(status);
        if (!isNumberType) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/status-invalid-type");
            messageResponse.setContent("Status invalid type.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/status-invalid-type",
                timestamp
            });
        }
        let statusValue = parseInt(status);
        let isValidStatus = checkStatusInCart(statusValue);
        if (!isValidStatus) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/status-invalid-value");
            messageResponse.setContent("Status invalid value.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/status-invalid-value",
                timestamp
            });
        }

        try {
            await CartModel.cartModel.findByIdAndUpdate(cartID, { status: statusValue });
            let mData = await getProductCart(customerID, id, timestamp);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("cart/update-status-success");
            messageResponse.setContent("Update status cart success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                productCarts: mData,
                code: "cart/update-status-success",
                timestamp
            });
        } catch (e) {
            console.log("=======updateStatus==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/update-status-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/update-status-failed",
                timestamp
            });
        }
    }

    updateStatusAll = async (req, res) => {
        let customerID = req.body.customerID;
        let isSelected = req.body.isSelected;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (isSelected === undefined || isSelected.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-isSelected");
            messageResponse.setContent("Missing isSelected");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-isSelected", timestamp });
        }

        if (isSelected !== 'true' && isSelected !== 'false') {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/update-status-all-failed");
            messageResponse.setContent("isSelected invalid type.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/update-status-all-failed",
                timestamp
            });
        }
        try {
            const filter = {
                customer_id: customerID,
                status: { $in: [STATUS_CART.DEFAULT.value, STATUS_CART.SELECTED.value] }
            };
            if (isSelected === 'true') {
                let dataCart = await CartModel.cartModel.updateMany(filter, { status: STATUS_CART.SELECTED.value });
                // console.log(dataCart.matchedCount);
                // console.log(dataCart.modifiedCount);
            } else {
                let dataCart = await CartModel.cartModel.updateMany(filter, { status: STATUS_CART.DEFAULT.value });
                // console.log(dataCart.matchedCount);
                // console.log(dataCart.modifiedCount);
            }
            let mData = await getProductCart(customerID, id, timestamp);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("cart/update-all-status-success");
            messageResponse.setContent("Update all status cart success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                productCarts: mData,
                code: "cart/update-all-status-success",
                timestamp
            });
        } catch (e) {
            console.log("=========updateStatusAll==========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/update-status-all-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/update-status-all-failed",
                timestamp
            });
        }
    }

    buyNow = async (req, res) => {
        let customerID = req.body.customer_id;
        let productID = req.body.product_id;
        let quantity = req.body.quantity;
        let note = req.body.note; // option
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-productid");
            messageResponse.setContent("Missing productID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-productid", timestamp });
        }

        try {
            let product = await ProductModel.productModel.findById(productID).lean();
            let isNumberType = isNumber(quantity);
            if (!isNumberType) {
                messageResponse.setStatusCode(400);
                messageResponse.setCode("cart/quantity-invalid-type");
                messageResponse.setContent("Quantity invalid type.");
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "cart/quantity-invalid-type",
                    timestamp
                });
            }
            let quantityValue = parseInt(quantity);
            let mData = [];
            let dataProductCart = {
                product_id: product._id,
                name: product.name,
                image: product.img_cover,
                price: product.price,
                quantity_product: product.quantity,
                quantity_cart: quantityValue,
                note: note,
                status_product: product.status,
                status_cart: STATUS_CART.BUYING.value
            }
            mData.push(dataProductCart);
            messageResponse.setStatusCode(200);
            messageResponse.setCode("cart/create-buy-now-success");
            messageResponse.setContent("Create buy now success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                productCarts: mData,
                code: "cart/create-buy-now-success",
                timestamp
            });
        } catch (e) {
            console.log("============buyNow===========");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/buy-now-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/buy-now-failed",
                timestamp
            });
        }
    }

    buyNowCart = async (req, res) => {
        let customerID = req.body.customerID;
        let cartID = req.body.cartID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (cartID === undefined || cartID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/missing-cartid");
            messageResponse.setContent("Missing cartID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "cart/missing-cartid", timestamp });
        }
        try {
            await CartModel.cartModel.findByIdAndUpdate(cartID, { status: STATUS_CART.SELECTED.value });
            let cartInfo = await CartModel.cartModel.findById(cartID);
            let product = await ProductModel.productModel.findById(cartInfo.product_id);

            let mData = [];
            let dataProductCart = {
                product_id: product._id,
                name: product.name,
                image: product.img_cover,
                price: product.price,
                quantity_product: product.quantity,
                quantity_cart: cartInfo.quantity,
                note: cartInfo.note,
                status_product: product.status,
                status_cart: STATUS_CART.BUYING.value
            }
            mData.push(dataProductCart);

            messageResponse.setStatusCode(200);
            messageResponse.setCode("cart/create-buy-now-cart-success");
            messageResponse.setContent("Create buy now cart success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                productCarts: mData,
                code: "cart/create-buy-now-cart-success",
                timestamp
            });
        } catch (e) {
            console.log("===========buyNowCart============");
            console.log(e.message.toString());
            console.log(e.code.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("cart/buy-now-cart-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "cart/buy-now-cart-failed",
                timestamp
            });
        }
    }

}

module.exports = new CartService;