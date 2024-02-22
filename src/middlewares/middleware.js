const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.checkPermission = (req,res,next)=>{
    const token = req.header('Authorization');
    if (!token) {
        return res.send({message: "wrong token", code: 0});
    }
    try {
        let data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log(data);
        if (data) {
            next();
        }
    } catch (e) {
        return res.send({message: "wrong token", code: 0});
    }
}
