const BaseModel = require('./model.base');

class MessageResponses extends BaseModel {
    constructor() {
        super();
        let code = 400;
        let title = '';
        let content = '';
        let image = '';

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
