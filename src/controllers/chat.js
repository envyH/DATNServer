const { } = require('../models/');
const { parseCookies } = require('../helpers/cookie');

class ChatController {
    show = async (req, res) => {
        const cookies = parseCookies(req);
        console.log(JSON.parse(cookies.dataUserLogged));
        try {
            return res.render('conversation', {
                layout: "conversation",
                userLoged: JSON.parse(cookies.dataUserLogged),
                conversations: [],
                isOpenLayotMsg: false,
                dataHeaderMsg: {},
                dataMessage: []
            });
        } catch (e) {
            console.log("ChatController: ", e.message);
            return res.send({ message: "Error getting data chat", code: 0 });
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

module.exports = new ChatController;