class BaseModel {
    constructor() {
        let _id = '';
        let created_at = '';

        this.getId = function () {
            return _id;
        }

        this.setId = function (value) {
            _id = value;
        }

        this.getCreatedAt = function () {
            return created_at;
        }

        this.setCreatedAt = function (value) {
            created_at = value;
        }

        this.toJSON = function () {
            return {
                _id: this.getId(),
                created_at: this.getCreatedAt()
            };
        };
    }

}

module.exports = BaseModel;
