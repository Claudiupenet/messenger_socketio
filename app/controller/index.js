const JWT = require('jsonwebtoken');

const User = require('../models/users')
const CONFIG = require("../config");

const register = (req, res) => {
	if (req.body && req.body.username && req.body.password && req.body.email) {
		var newUser = new User({
			username: req.body.username,
			password: req.body.password,
			email: req.body.email,
			description: req.body.description ? req.body.description : null,
			picture: req.body.picture ? req.body.picture : null,
			phone: req.body.phone ? req.body.phone : null,
			age: req.body.age ? req.body.age : null,
			sex: req.body.sex ? req.body.sex : null
		})

		newUser.save((err, result) => {
			if (err) {
				console.log(err);
				res.sendStatus(409);
			} else {
				res.status(200).json({message: "Registered with success"})
			}
		})
	} else {
		res.status(422).json({message: "Please provide all data for register process"})
	}
}

const login = (req, res) => {
	if (req.body && req.body.username && req.body.password) {
		User.findOne({
			username: req.body.username,
			password: req.body.password
		})
		.then(result => {
			if (result == null) {
				res.status(401).json({message: "Wrong combination"})
			} else {
				var TOKEN = JWT.sign({
					username: req.body.username,
					exp: Math.floor(Date.now() / 1000) + CONFIG.JWT_EXPIRE_TIME
				},
				CONFIG.JWT_SECRET_KEY);

				res.status(200).json({token: TOKEN})
			}
		})
	} else {
		res.status(422).json({message: "Provide all data"})
	}
}

const get_my_data = (req, res) => {
	console.log(req.user)
	console.log(req.token_payload)
	console.log(req.ioana)
	if(req.headers["token"]) {
		JWT.verify(req.headers["token"], CONFIG.JWT_SECRET_KEY, (err, payload) => {
			const user = User.findOne({username: payload.username})
			// console.log(err, payload.username, user)
		})
		//const user = get_user(req.headers["token"]);
		//console.log(req.headers["token"], user)
		res.sendStatus(200);
	} else {
		res.status(403).json({message: "Missing login token"})
	}
}


const extractDataMiddleware = (req, res, next) => {
	if(req.token_payload.username) {
		User.findOne({username: req.token_payload.username})
		.then(result => {
			if(result !== null) {
				req.user = result;
				req.ioana = "cur";
				next();
			} else {
				res.status(404).json({message: "Missing user"})
			}
		
		})
	} else {
		res.status(404).json({message: "Missing user field"})
	}
}

module.exports = {
	register,
	login,
	get_my_data,
	extractDataMiddleware
}