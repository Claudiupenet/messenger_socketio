const express = require('express');
const JWT = require("jsonwebtoken");
const CONFIG = require('../config');
const CONTROLLER = require('../controller/index')

const router = express.Router();

router.get('/healthcheck', (req, res) => {
	res.status(200).json({message: "Server is alive"})
})
const authMiddleware = (req, res, next) => {
	if(req.headers["token"]) {
		JWT.verify(req.headers["token"], CONFIG.JWT_SECRET_KEY, (err, payload) => {
			if(err) {
				res.status(403).json({message: "invalid token"})
			} else {
				req.token_payload = payload;
				next();
			}
		})
	} else {
		res.status(403).json({message: "Missing login token"})
	}
}

router.post("/register", CONTROLLER.register);
router.post("/login", CONTROLLER.login);
router.use("/user", authMiddleware);
router.use("/user", CONTROLLER.extractDataMiddleware);
router.get('/user/get_my_data', CONTROLLER.get_my_data);

module.exports = router;