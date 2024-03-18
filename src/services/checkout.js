const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CartModel = require('../models/model.cart');
const ProductModel = require('../models/model.product');

const { STATUS_CART } = require('../utils/cart');
const { PAYMENT_METHOD } = require('../utils/payment');


async function getProductCart(customerID) {
    let carts = await CartModel.cartModel.find({ customer_id: customerID }).lean();
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

class CheckoutService {
    getProductCheckout = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "checkout/missing-customerid", timestamp });
        }

        try {
            let mData = await getProductCart(customerID);
            // console.log(mData);
            return res.send({
                message: "get product checkout success",
                statusCode: 200,
                productCarts: mData,
                code: "checkout/get-productcheckout-success",
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "checkout/get-productcheckout-failed",
                timestamp
            });
        }
    }

    getPaymentMethod = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "checkout/missing-customerid", timestamp });
        }

        try {
            let paymentMethod = new Map();
            paymentMethod.set(PAYMENT_METHOD.ON_DELIVERY.value, "Thanh toán khi nhận hàng");
            paymentMethod.set(PAYMENT_METHOD.E_BANKING.value, "E-Banking");
            paymentMethod.set(PAYMENT_METHOD.ZALO_PAY.value, "ZaloPay");
            // console.log(paymentMethod.get(PAYMENT_METHOD.ON_DELIVERY.value));
            let paymentMethodObject = {};
            paymentMethod.forEach((value, key) => {
                paymentMethodObject[key] = value;
            });
            return res.send({
                message: "get payment method success",
                statusCode: 200,
                paymentMethod: paymentMethodObject,
                code: "checkout/get-payment-method-success",
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "checkout/get-payment-method-failed",
                timestamp
            });
        }
    }
}

module.exports = new CheckoutService;