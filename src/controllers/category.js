
const moment = require('moment-timezone');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";

const UploadFileFirebase = require('../services/uploadFileFirebase');
const CategoryModel = require('../models/model.category');


class CategoryController {

    show = async (req, res) => {
        try {
            let listCategory = await CategoryModel.categoryModel.find().lean();
            return res.render('category', {
                terifyWith: "Admin",
                layout: "category",
                category: listCategory
            });
        } catch (e) {
            console.log(e.message);
            return res.send({ message: "category not found", code: 0 });
        }

    }
    create = async (req, res) => {
        try {
            let date = new Date();
            let dataTime = moment(date).tz(specificTimeZone).format(formatType);

            const name = req.body.name;
            if (!req.file) {
                return res.status(400).send('Error: not receiving file');
            }
            const fileimg = req.file;

            if (name == null || name.toString().trim().length === 0) {
                return res.send({ message: "name category require", code: 0 });
            }
            if (fileimg == null) {
                return res.send({ message: "image category require", code: 0 });
            }

            let category = new CategoryModel.categoryModel({
                name,
                created_time: dataTime,
            });
            // console.log(fileimg);
            let img = await UploadFileFirebase.uploadFileToFBStorage(
                category._id.toString(),
                "",
                "categories",
                fileimg
            );
            if (img === 0) {
                return res.send({ message: "Failed to upload image category", code: 0 });
            }
            category.image = img;
            await category.save();
            return res.redirect("/category")

        } catch (e) {
            console.log(e.message);
            return res.send({ message: "Error add category", code: 0 });
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

module.exports = new CategoryController;