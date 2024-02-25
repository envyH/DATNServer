const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CartModel = require('../models/model.cart');
const ProductModel = require('../models/model.product');

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
        // console.log(cart._id.toString());
        let productInfo = dataProduct.find(product => product._id.toString() === cart.product_id.toString());
        let dataResponse = {
            _id: cart._id,
            name: productInfo.name,
            image: productInfo.img_cover,
            quantity_product: productInfo.quantity,
            quantity_cart: cart.quantity,
            price: productInfo.price,
            note: cart.note,
            status_cart: cart.status,
            status_product: productInfo.status,
            created_at: cart.created_at,
        }
        mData.push(dataResponse);
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
            let newQuantity = 1;
            if (cart) {
                newQuantity = parseInt(cart.quantity) + parseInt(mQuantity);
            }
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


    getByCustomerID = async (req, res) => {
        const customerID = req.body.customerID;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        try {
            let mData = await getProductCart(customerID);
            // console.log(mData);
            return res.send({
                message: "get data cart success",
                statusCode: 200,
                productCarts: mData,
                code: "cart/getbycustomerid-success",
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
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

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (cartID === undefined || cartID.trim().length == 0) {
            return res.send({ message: "missing cartID", statusCode: 400, code: "cart/missing-cartid", timestamp });
        }
        if (type === undefined || type.trim().length == 0) {
            return res.send({ message: "missing type", statusCode: 400, code: "cart/missing-type", timestamp });
        }
        if (mQuantity === undefined || parseInt(mQuantity) == 0) {
            return res.send({ message: "missing quantity", statusCode: 400, code: "cart/missing-quantity", timestamp });
        }

        try {
            let cartSelected = await CartModel.cartModel.findById(cartID).lean();
            if (cartSelected) {
                let newQuantity = parseInt(cartSelected.quantity);
                if (type === "plus") {
                    newQuantity += parseInt(mQuantity);
                } else if (type === "minus") {
                    if (newQuantity > parseInt(mQuantity)) {
                        newQuantity -= parseInt(mQuantity);
                    }
                }
                await CartModel.cartModel.findByIdAndUpdate(cartID, { quantity: newQuantity.toString() });
                let mData = await getProductCart(customerID);
                return res.send({
                    message: "update quantity success",
                    statusCode: 200,
                    productCarts: mData,
                    code: "cart/update-quantity-success",
                    timestamp
                });
            }
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "cart/update-quantity-failed",
                timestamp
            });
        }
    }
}

module.exports = new CartService;