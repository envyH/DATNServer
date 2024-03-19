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
    createNotification = async (title, content, img, fcm) => {
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
                imageURL: img !== undefined ? img.toString().trim().length > 0  ? img : "" : "",
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


        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponseRequire = new MessageResponses();
        const id = uuidv4();
        messageResponseRequire.setId(id);
        messageResponseRequire.setStatusCode(400);
        messageResponseRequire.setCreatedAt(timestamp);

        if (title === undefined || title.toString().trim().length == 0) {
            messageResponseRequire.setCode("notification/missing-title");
            messageResponseRequire.setContent("missing title");
            return res.send({ message: messageResponseRequire.toJSON(), statusCode: 400, code: "notification/missing-title", timestamp });
        }
        if (content === undefined || content.toString().trim().length == 0) {
            messageResponseRequire.setCode("notification/missing-content");
            messageResponseRequire.setContent("missing content");
            return res.send({ message: messageResponseRequire.toJSON(), statusCode: 400, code: "notification/missing-content", timestamp });
        }
        if (fcm === undefined || fcm.toString().trim().length == 0) {
            messageResponseRequire.setCode("notification/missing-fcm");
            messageResponseRequire.setContent("missing fcm");
            return res.send({ message: messageResponseRequire.toJSON(), statusCode: 400, code: "notification/missing-fcm", timestamp });
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
                imageURL: img !== undefined ? img.toString().trim().length > 0  ? img : "" : "",
            },
            token: fcm,
        };
        admin.messaging().send(message)
            .then((response) => {
                return res.send({
                    message: `Successfully sent message: ${response}`,
                    statusCode: 200,
                    code: "notification/send-success",
                    timestamp
                });
            })
            .catch((error) => {
                return res.send({
                    message: `Error sending message: ${error}`,
                    statusCode: 400,
                    code: "notification/send-failed",
                    timestamp
                });
            });
    }

}

module.exports = new NotificationService;
