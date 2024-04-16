const {} = require('../models/');

class ChatController {
    show = async (req, res) => {
        try {
            return res.render('chat', {
                verifyWith: "Admin",
                layout: "chat",
                code: 1
            });
        } catch (e) {
            console.log("ChatController: ", e.message);
            return res.send({message: "Error getting data chat", code: 0});
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