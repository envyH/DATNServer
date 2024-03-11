require('dotenv').config();
const mongoose = require('mongoose');
const connecURL = process.env.URL_DB;

class Database {

    constructor() {
        this.connect();
    }
    connect(type = 'mongodb') {
        mongoose.connect(connecURL).then(_ => console.log(`Connect DB Success`))
            .catch(err => console.log(`Error connect DB: ${err.message}`));
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMongoDB = Database.getInstance();
module.exports = instanceMongoDB;