const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CartModel = require('../models/model.cart');


class CartService {
    addToCart = async (req, res) => {
        const customerID = req.body.customer_id;
        const productID = req.body.product_id;
        const mQuantity = req.body.quantity;
        const status = req.body.status; // first option
        const note = req.body.note; // option
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (productID === undefined || productID.trim().length == 0) {
            return res.send({ message: "missing productID", statusCode: 400, code: "cart/missing-productid", timestamp });
        }
        if (mQuantity === undefined || parseInt(mQuantity) == 0) {
            return res.send({ message: "missing quantity", statusCode: 400, code: "cart/missing-quantity", timestamp });
        }

        try {
            const filter = { customer_id: customerID, product_id: productID };
            let cart = await CartModel.cartModel.findOne(filter).lean();
            let newQuantity = parseInt(cart.quantity) + parseInt(mQuantity);
            const update = { quantity: newQuantity };
            if (cart) {
                // TODO update quantity
                await CartModel.cartModel.findOneAndUpdate(filter, update);
                return res.send({
                    message: "update quantity success",
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
                return res.send({
                    message: "add to cart success",
                    statusCode: 200,
                    code: "cart/add-success",
                    timestamp
                });
            }
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "cart/add-failed",
                timestamp
            });
        }
    }
}

module.exports = new CartService;