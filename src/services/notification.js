const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require('bcrypt');
const { admin } = require('../configs/firebase/index');


const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";


const FirebaseService = require('./firebase');

const { NotificationModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class NotificationService {
    createNotification = async (title, content, img, fcm, type) => {
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        // create notification
        let notification = new NotificationModel.notificationModel({
            title: title,
            content: content,
            image: img,
            created_at: timestamp,
        });
        await notification.save();

        // send notification
        let message = {
            data: {
                title: title,
                body: content,
                type: type,
                imageURL: img !== undefined ? img.toString().trim().length > 0 ? img : "" : "",
            },
            token: fcm,
        };
        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    }

    createNotification2 = async (req, res) => {
        const title = req.body.title;
        const content = req.body.content;
        const img = req.body.img;
        const fcm = req.body.fcm;
        const type = req.body.type;


        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (title === undefined || title.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-title");
            messageResponse.setContent("missing title");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-title", timestamp });
        }
        if (content === undefined || content.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-content");
            messageResponse.setContent("missing content");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-content", timestamp });
        }
        if (fcm === undefined || fcm.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-fcm");
            messageResponse.setContent("missing fcm");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-fcm", timestamp });
        }
        if (type === undefined || type.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-type");
            messageResponse.setContent("missing type");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-type", timestamp });
        }

        // create notification
        let notification = new NotificationModel.notificationModel({
            title: title,
            content: content,
            image: img,
            created_at: timestamp,
        });
        await notification.save();

        // send notification
        let message = {
            data: {
                title: title,
                body: content,
                type: type,
                imageURL: img !== undefined ? img.toString().trim().length > 0 ? img : "" : "",
            },
            token: fcm,
        };
        admin.messaging().send(message)
            .then((response) => {
                messageResponse.setStatusCode(200);
                messageResponse.setCode("notification/send-success");
                messageResponse.setContent(`Successfully sent message: ${response}`);
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 200,
                    code: "notification/send-success",
                    timestamp
                });
            })
            .catch((error) => {
                console.log("==========createNotification2=========");
                console.log(error.message.toString());
                messageResponse.setStatusCode(400);
                messageResponse.setCode(error.code.toString());
                messageResponse.setContent(`Sending message: ${error}`);
                return res.send({
                    message: messageResponse.toJSON(),
                    statusCode: 400,
                    code: "notification/send-failed",
                    timestamp
                });
            });
    }

}

module.exports = new NotificationService;
