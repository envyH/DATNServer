const CustomerModel = require('../models/model.customer');


class CustomerController {
    show = async (req, res) => {
        try {
            let listCus = await CustomerModel.customerModel.find({ status: { $ne: 'banned' } });
            // console.log(listCus);
            return res.render('index', {
                terifyWith: "Admin",
                layout: "customer",
                customers: listCus,
                code: 1
            });
        } catch (e) {
            console.log(e.message);
            return res.send({ message: "Error getting customers", code: 0 });
        }

    }

    edit = (req, res, next) => {

    }
    update = (req, res, next) => {

    }
    destroy(req, res, next) {

    }

    showAll = (req, res) => {

    }

}

module.exports = new CustomerController;