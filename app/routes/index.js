const express = require('express');
const JWT = require("jsonwebtoken");
const CONFIG = require('../config');
const CONTROLLER = require('../controller/index')

const router = express.Router();

router.get('/healthcheck', (req, res) => {
	res.status(200).json({message: "Server is alive"})
})

router.post("/register", CONTROLLER.register);
router.post("/login", CONTROLLER.login);
router.use("/user", CONTROLLER.authMiddleware);
router.use("/user", CONTROLLER.extractDataMiddleware);
router.get('/user/get_my_data', CONTROLLER.get_my_data);
router.post('/user/send_friend_request', CONTROLLER.send_friend_request);
router.post('/user/confirm_friend_request', CONTROLLER.confirm_friend_request)

module.exports = router;