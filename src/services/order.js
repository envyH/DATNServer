const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const ProductModel = require('../models/model.product');
const CartModel = require('../models/model.cart');
const OrderModel = require('../models/model.order');

const { isNumber } = require('../utils/index');
const { STATUS_CART } = require('../utils/cart');
const { checkPaymentMethod, PAYMENT_METHOD } = require('../utils/payment');


async function getProductCart(customerID) {
    let carts = await CartModel.cartModel.find({ customer_id: customerID, status: 1 }).lean();
    let dataProduct = [];
    await Promise.all(
        carts.map(async (cart) => {
            try {
                let prodductInfo = await ProductModel.productModel.findById(cart.product_id).lean();
                dataProduct.push(prodductInfo);
            } catch (e) {
                console.log(e.message);
                return res.send({
                    message: e.message.toString(),
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

class OrderService {
    getAmountZaloPay = async (req, res) => {
        const customerID = req.body.customerID;
        const type = req.body.type;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "checkout/missing-customerid", timestamp });
        }
        if (type === undefined) {
            return res.send({ message: "missing type", statusCode: 400, code: "cart/missing-type", timestamp });
        }
        let isNumberType = isNumber(type);
        if (!isNumberType) {
            return res.send({
                message: "type not a number",
                statusCode: 400,
                productCarts: [],
                code: "order/type-nan",
                timestamp
            });
        }

        let typeValue = parseInt(type)
        let isValidType = checkPaymentMethod(typeValue);
        if (!isValidType) {
            return res.send({
                message: "payment method invalid value",
                statusCode: 400,
                code: "order/payment-method-invalid-value",
                timestamp
            });
        }

        try {
            let productOrders = await getProductCart(customerID);
            let sum = 0;
            await Promise.all(
                productOrders.map(async (productOrder) => {
                    let priceOne = productOrder.price;
                    sum += priceOne * parseInt(productOrder.quantity_cart);
                })
            );

            return res.send({
                message: "create order success",
                statusCode: 200,
                amount: sum,
                code: "order/get-amount-zalopay-success",
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "order/get-amount-zalopay-failed",
                timestamp
            });
        }
    }

    createOrderZaloPay = async (req, res) => {
        const customerID = req.body.customerID;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "checkout/missing-customerid", timestamp });
        }


        try {
            let order = new OrderModel.orderModel({
                customer_id: customerID,
                payment_methods: PAYMENT_METHOD.ZALO_PAY.value,
                created_at: timestamp,
            });
            await order.save();
            return res.send({
                message: "create order zalopay success",
                statusCode: 200,
                code: "order/create-order-zalopay-success",
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "order/create-order-zalopay-failed",
                timestamp
            });
        }
    }


}

module.exports = new OrderService;