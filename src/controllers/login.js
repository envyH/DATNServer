const bcrypt = require('bcrypt');
const moment = require('moment-timezone');

const { } = require('../models/');
const { parseCookies } = require('../helpers/cookie');
const { TYPE_LOGIN, checkTypeLogin } = require('../utils/login');
const { AdminModel, EmployeeModel } = require('../models');

const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";


const doLoginAdmin = async (res, username, password) => {
    let date = new Date();
    let timestamp = moment(date).tz(specificTimeZone).format(formatType);

    const filter = {
        email: username
    }
    const select = {
        _id: 0,
        avatar: 1,
        email: 1,
        password: 1

    }
    try {
        let admin = await AdminModel.adminModel.findOne(filter).select('-_id').lean();
        if (!admin) {
            return res.send({
                message: "admin not found",
                code: "auth/admin-not-found",
                statusCode: 400,
                timestamp
            });
        }
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.send({
                message: "wrong password",
                statusCode: 400,
                code: "auth/wrong-password",
                timestamp
            });
        }
        return res.send({
            message: "Login admin success",
            statusCode: 200,
            metadata: admin,
            code: `auth/login-admin-success`,
            timestamp
        });
    } catch (e) {
        console.log("=========doLoginAdmin=========");
        console.log(e.message.toString());
        return res.send({
            message: "Login admin failed",
            statusCode: 400,
            code: `auth/login-admin-failed`,
            timestamp
        });
    }
}
class LoginController {
    show = async (req, res) => {
        const cookies = parseCookies(req);
        let typeLogin;
        switch (parseInt(cookies.typeLogin)) {
            case TYPE_LOGIN.ADMIN.value:
                typeLogin = TYPE_LOGIN.ADMIN.role;
                break;
            case TYPE_LOGIN.EMPLOYEE.value:
                typeLogin = TYPE_LOGIN.EMPLOYEE.role;
                break;
            default:
                typeLogin = undefined;
                break;
        }
        console.log(typeLogin);
        try {
            return res.render('login', {
                typeLogin: typeLogin,

            });
        } catch (e) {
            console.log("LoginController: ", e.message);
            return res.send({ message: "Error getting login screen", code: 0 });
        }

    }

    login = async (req, res, next) => {
        const typeLogin = parseCookies(req).typeLogin;
        const username = req.body.username;
        const password = req.body.password;
        switch (parseInt(typeLogin)) {
            case TYPE_LOGIN.ADMIN.value:
                await doLoginAdmin(res, username, password);
                break;

            case TYPE_LOGIN.EMPLOYEE.value:
                console.log("employee");
                break;

            default:
                console.log("default");
                break;
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

module.exports = new LoginController;