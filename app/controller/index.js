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
		console.log(req.body)
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
	if(req.user) {
		res.status(200).json({username: req.user.username, picture: req.user.picture, phone: req.user.phone})
	}
}

// status: 0 = friend confirmed, 1 = received friend request, 2 = unconfirmed friend

const send_friend_request = (req, res) => {
	if(!req.body.friend_id) {
		res.status(400).json({message: "Please provide friend id!"})
	} else {
		User.findById(req.body.friend_id)
		.then(data => {
			User.updateOne({email: data.email}, {
				$set: {
					friends: [...(data.friends ? data.friends : []), {email: req.user.email, status: 1} ]
				}
			})
			.then(result => {
				User.updateOne({email: req.user.email}, {
					$set: {
						friends: [...(data.friends ? data.friends : []), {email: data.email, status: 2} ]
					}
				})
				.then(blabla => {

					res.status(200).json({message: "Friend request sent!"})
				})
				.catch(errss => {
					res.status(500).json({message: "Error when adding friend"})
				} )
			})
			.catch(err => {
				res.status(500).json({message: "Database error at adding friend request."})
			})
		})
		.catch(err => {
			res.status(500).json({message: "Wrong friend id!"})
		})
	}
}

const confirm_friend_request = (req, res) =>  {
	if(!req.body.friend_id) {
		res.status(400).json({message: "Please provide friend id!"})
	} else {
		User.findById(req.body.friend_id)
		.then( data => {
			User.updateOne({email: data.email}, {
				$set: {
					friends: data.friends.map( friend => {
						if(friend.email === req.user.email) {
							friend.status = 0
						}
						return friend;
					})
				}
			})
			.then(result => {
				User.updateOne({email: req.user.email}, {
					$set: {
						friends: [...data.friends, {}]
					}
				})
			})
		})
	}
}


const extractDataMiddleware = (req, res, next) => {
	if(req.token_payload.username) {
		User.findOne({username: req.token_payload.username})
		.then(result => {
			if(result !== null) {
				req.user = result;
				next();
			} else {
				res.status(404).json({message: "Missing user"})
			}
		
		})
	} else {
		res.status(404).json({message: "Missing user field"})
	}
}

const authMiddleware = (req, res, next) => {
	if(req.headers["token"]) {
		JWT.verify(req.headers["token"], CONFIG.JWT_SECRET_KEY, (err, payload) => {
			if(err) {
				res.status(403).json({message: "Invalid token"})
			} else {
				req.token_payload = payload;
				next();
			}
		})
	} else {
		res.status(403).json({message: "Missing login token"})
	}
}

module.exports = {
	register,
	login,
	get_my_data,
	authMiddleware,
	extractDataMiddleware,
	send_friend_request,
	confirm_friend_request
}