const BaseModel = require('./model.base');

class MessageResponses extends BaseModel {
    constructor() {
        super();
        let statusCode = 400;
        let code = '';
        let title = '';
        let content = '';
        let image = '';

        this.getStatusCode = function () {
            return statusCode;
        }

        this.setStatusCode = function (value) {
            statusCode = value;
        }

        this.getCode = function () {
            return code;
        }

        this.setCode = function (value) {
            code = value;
        }

        this.getTitle = function () {
            return title;
        }

        this.setTitle = function (value) {
            title = value;
        }

        this.getContent = function () {
            return content;
        }

        this.setContent = function (value) {
            content = value;
        }

        this.getImage = function () {
            return image;
        }

        this.setImage = function (value) {
            image = value;
        }


        this.toJSON = function () {
            return {
                _id: this.getId(),
                statusCode: this.getStatusCode(),
                code: this.getCode(),
                title: this.getTitle(),
                content: this.getContent(),
                image: this.getImage(),
                created_at: this.getCreatedAt()
            };
        };
    }
}

module.exports = MessageResponses;
