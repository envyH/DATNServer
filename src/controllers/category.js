const Category = require('../models/model.category');

class CategoryController {

    create = (req, res) => {
        return res.json(req.body);
    }


    show = (req, res) => {
        return res.render('category')
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

module.exports = new CategoryController;