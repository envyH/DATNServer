"use strict";
require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.USERNAME_EMAIL,
        pass: process.env.PASS_EMAIL,
    },
});

const sendEmailVerifyCus = (email, text) => {
    let index = 1;
    const mailOptions = {
        from: process.env.USERNAME_EMAIL,
        to: email,
        subject: 'STECH Xin Chào Bạn',
        text: text,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            index = 0;
        }
    });
    return index;
};

module.exports = { sendEmailVerifyCus };