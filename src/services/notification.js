const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require('bcrypt');
const { admin } = require('../configs/firebase/index');


const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";


const FirebaseService = require('./firebase');

const { NotificationModel } = require('../models');


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

}

module.exports = new NotificationService;
