const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CartModel = require('../models/model.cart');
const ProductModel = require('../models/model.product');


const STATUS_CART = {
    DEFAULT: { value: 0 },
    SELECTED: { value: 1 },
    BUYING: { value: 2 }
};

Object.keys(STATUS_CART).forEach(key => {
    const status = STATUS_CART[key];
    Object.defineProperty(status, 'getValue', {
        value: function () {
            return this.value;
        },
        enumerable: false
    });
});

const checkStatusInCart = (value) => {
    for (let key in STATUS_CART) {
        if (STATUS_CART[key].value === value) {
            return true;
        }
    }
    return false;
}



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
        let dataResponse = {
            _id: cart._id,
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
        if (mQuantity === undefined || parseInt(mQuantity) <= 0) {
            return res.send({ message: "missing quantity", statusCode: 400, code: "cart/missing-quantity", timestamp });
        }
        let quantityValue = parseInt(mQuantity);
        if (typeof quantityValue !== 'number') {
            return res.send({
                message: "quantity not a number",
                statusCode: 400,
                productCarts: [],
                code: "cart/quantity-nan",
                timestamp
            });
        }

        try {
            let cartSelected = await CartModel.cartModel.findById(cartID).lean();
            let dataProduct = await ProductModel.productModel.findById(cartSelected.product_id);
            if (cartSelected) {
                let newQuantity = parseInt(cartSelected.quantity);
                if (type === "plus") {
                    if (newQuantity + quantityValue <= parseInt(dataProduct.quantity)) {
                        newQuantity += quantityValue;
                    } else {
                        return res.send({
                            message: "plus not change",
                            statusCode: 400,
                            code: "cart/plus-not-change",
                            timestamp
                        });
                    }
                } else {
                    if (newQuantity > quantityValue) {
                        newQuantity -= quantityValue;
                    } else {
                        return res.send({
                            message: "minus not change",
                            statusCode: 400,
                            code: "cart/minus-not-change",
                            timestamp
                        });
                    }
                }
                await CartModel.cartModel.findByIdAndUpdate(cartID, { quantity: newQuantity.toString() });
                return res.send({
                    message: "update quantity success",
                    statusCode: 200,
                    productCarts: [],
                    quantity: newQuantity,
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
    updateStatus = async (req, res) => {
        let cartID = req.body.cartID;
        let customerID = req.body.customerID;
        let status = req.body.status;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        if (customerID === undefined || customerID.trim().length == 0) {
            return res.send({ message: "missing customerID", statusCode: 400, code: "cart/missing-customerid", timestamp });
        }
        if (cartID === undefined || cartID.trim().length == 0) {
            return res.send({ message: "missing cartID", statusCode: 400, code: "cart/missing-cartid", timestamp });
        }
        if (status === undefined) {
            return res.send({ message: "missing status", statusCode: 400, code: "cart/missing-status", timestamp });
        }

        let cartSelected = await CartModel.cartModel.findById(cartID).lean();
        let statusValue = parseInt(status);
        if (typeof statusValue !== 'number') {
            return res.send({
                message: "status invalid type",
                statusCode: 400,
                productCarts: [],
                code: "cart/update-status-failed:" + cartSelected.status,
                // code: "cart/status-invalid-type",
                timestamp
            });
        }

        
        let isValidStatus = checkStatusInCart(statusValue);
        if (!isValidStatus) {
            return res.send({
                message: "status invalid value",
                statusCode: 400,
                productCarts: [],
                code: "cart/update-status-failed:" + cartSelected.status,
                // code: "cart/status-invalid-value",
                timestamp
            });
        }

        try {
            await CartModel.cartModel.findByIdAndUpdate(cartID, { status: statusValue });
            return res.send({
                message: "update status cart success",
                statusCode: 200,
                code: "cart/update-status-success:" + statusValue,
                timestamp
            });
        } catch (e) {
            console.log(e.message);
            return res.send({
                message: e.message.toString(),
                statusCode: 400,
                code: "cart/update-status-failed",
                timestamp
            });
        }
    }
}

module.exports = new CartService;