const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require('bcrypt');
const { admin } = require('../configs/firebase/index');


const specificTimeZone = 'Asia/Ho_Chi_Minh';
const formatType = "YYYY-MM-DD-HH:mm:ss";


const FirebaseService = require('./firebase');

const { isNumber } = require('../utils/index');
const { STATUS_NOTIFICATION, checkStatus } = require('../utils/notification');
const { NotificationModel } = require('../models');
const MessageResponses = require('../models/model.message.response');


class NotificationService {
    createNotification = async (customerID, title, content, img, fcm, type) => {
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        // create notification
        let notification = new NotificationModel.notificationModel({
            customer_id: customerID,
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
                type: type + "",
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

    getList = async (req, res) => {
        const customerID = req.body.customerID;

        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-customerid", timestamp });
        }
        try {
            const filter = {
                customer_id: customerID,
                status: { $in: [STATUS_NOTIFICATION.DEFAULT.value, STATUS_NOTIFICATION.SEEN.value] }
            }
            let notifications = await NotificationModel.notificationModel.find(filter).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("notification/get-success");
            messageResponse.setContent("Get list notification success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                code: "notification/get-success",
                notifications: notifications,
                timestamp
            });
        } catch (e) {
            console.log("======getList========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/get-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "notification/get-failed",
                timestamp
            });
        }
    }

    updateStatus = async (req, res) => {
        const customerID = req.body.customerID;
        const notificationID = req.body.notificationID;
        const status = req.body.status;
        let date = new Date();
        let timestamp = moment(date).tz(specificTimeZone).format(formatType);

        let messageResponse = new MessageResponses();
        const id = uuidv4();
        messageResponse.setId(id);
        messageResponse.setCreatedAt(timestamp);

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-customerid", timestamp });
        }
        if (notificationID === undefined || notificationID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-notificationid");
            messageResponse.setContent("Missing notificationID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-notificationid", timestamp });
        }
        if (status === undefined) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("order/missing-status");
            messageResponse.setContent("Missing status");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-status", timestamp });
        }

        let isNumberStatus = isNumber(status);
        if (!isNumberStatus) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/status-nan");
            messageResponse.setContent("status notification not a number.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                notifications: [],
                code: "notification/status-nan",
                timestamp
            });
        }

        let statusValue = parseInt(status)
        let isValidStatus = checkStatus(statusValue);
        if (!isValidStatus) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/status-notification-invalid-value");
            messageResponse.setContent("status notification invalid value.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "notification/status-notification-invalid-value",
                timestamp
            });
        }

        try {
            const filter = {
                _id: notificationID
            }
            const update = { status: statusValue };
            await NotificationModel.notificationModel.findOneAndUpdate(filter, update).lean();
            const filterGet = {
                customer_id: customerID,
                status: { $in: [STATUS_NOTIFICATION.DEFAULT.value, STATUS_NOTIFICATION.SEEN.value] }
            }
            let notifications = await NotificationModel.notificationModel.find(filterGet).lean();
            messageResponse.setStatusCode(200);
            messageResponse.setCode("notification/update-status-success");
            messageResponse.setContent("Update status notification success.");
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 200,
                notifications: notifications,
                code: "notification/update-status-success",
                timestamp
            });
        } catch (e) {
            console.log("=========updateStatus==========");
            console.log(e.message.toString());
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/update-status-failed");
            messageResponse.setContent(e.message.toString());
            return res.send({
                message: messageResponse.toJSON(),
                statusCode: 400,
                code: "notification/update-status-failed",
                timestamp
            });
        }
    }

    createNotification2 = async (req, res) => {
        const customerID = req.body.customerID;
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

        if (customerID === undefined || customerID.toString().trim().length == 0) {
            messageResponse.setStatusCode(400);
            messageResponse.setCode("notification/missing-customerid");
            messageResponse.setContent("Missing customerID");
            return res.send({ message: messageResponse.toJSON(), statusCode: 400, code: "notification/missing-customerid", timestamp });
        }

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
            customer_id: customerID,
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
