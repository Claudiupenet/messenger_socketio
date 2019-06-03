const JWT = require('jsonwebtoken');

const User = require('../models/user');
const Conversation = require('../models/conversation');
const CONFIG = require("../config");

const register = (req, res) => {
	if (req.body && req.body.username && req.body.password && req.body.email) {
		var newUser = new User({
			username: req.body.username,
			password: req.body.password,
			email: req.body.email,
			description: req.body.description,
			picture: req.body.picture,
			phone: req.body.phone,
			age: req.body.age,
			sex: req.body.sex,
			friends: []
		})

		newUser.save((err, result) => {
			if (err) {
				console.log(err);
				res.sendStatus(409);
			} else {
				res.status(200).json({ message: "Registered with success" })
			}
		})
	} else {
		console.log(req.body)
		res.status(422).json({ message: "Please provide all data for register process" })
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
					res.status(401).json({ message: "Wrong combination" })
				} else {
					var TOKEN = JWT.sign({
						username: req.body.username,
						exp: Math.floor(Date.now() / 1000) + CONFIG.JWT_EXPIRE_TIME
					},
						CONFIG.JWT_SECRET_KEY);

					res.status(200).json({ token: TOKEN })
				}
			})
	} else {
		res.status(422).json({ message: "Provide all data" })
	}
}

const get_my_data = (req, res) => {
	if (req.user) {
		res.status(200).json({ username: req.user.username, picture: req.user.picture, phone: req.user.phone })
	} else {
		res.status(500).json({message: "Error with the database!"})
	}
}

// status: 0 = friend confirmed, 1 = received friend request, 2 = unconfirmed friend

const send_friend_request = (req, res) => {
	if (!req.body.friend_id) {
		res.status(400).json({ message: "Please provide friend_id!" })
	} else if (req.user._id.equals(req.body.friend_id)) {
		res.status(400).json({message: "You cannot send a friend request to yourself!"})
	} else {
		User.findById(req.body.friend_id, (error, friendWannaBe) => {
			if(error) {
				res.status(500).json({message: "Database error " + err})
			} else if (friendWannaBe === null) {
				res.status(404).json({message: "User not found! Wrond friend_id?"})
			} else {

				if(friendWannaBe.friends.find(friend => friend.friend.equals(req.user._id)) === undefined) {
					var conversation = new Conversation({participants: [req.user._id, friendWannaBe._id]});
					conversation.save((error, callback) => {
						if(error) {
							res.status(500).json({message: "Error at saving convesation"})
						} else {

							friendWannaBe.friends.push({friend: req.user._id, status: 1, conversation: callback._id})
							friendWannaBe.save((e) => {
								if(e) {
									res.status(500).json({message: "Error at adding friend request " + e})
								} else {

									User.findById(req.user._id, (err, currentUser) => {
										if(err) {
											res.status(500).json({message: "Database error " + err})
										} else if(currentUser === null) {
											res.status(404).json({message: "User not fond. Bad token? "})
										
										} else {
											if(currentUser.friends.find(friend => friend.friend.equals(friendWannaBe._id)) === undefined) {
												currentUser.friends.push({friend: friendWannaBe._id, status: 2, conversation: callback._id})
												currentUser.save()
												res.status(200).json({message: "Friend request sent!"})
											} else {
												res.status(409).json({message: "Already friend or request sent/received!"})
											}
										}
									})
								}
							})

						}
					})

	
	
				} else {
					res.status(409).json({message: "Already friend or request sent/received!"})
				}
			}

		})

	}
}

const confirm_friend_request = (req, res) => {
	if (!req.body.friend_id) {
		res.status(400).json({ message: "Please provide friend id!" })
	} else if(req.user._id.equals(req.body.friend_id)) {
		res.status(400).json({message: "You cannot confirm a friend request you have sent!"})
	} else {

		User.findById(req.body.friend_id, (error, newFriend) => {
			if(error) {
				res.status(500).json({message: "Database error " + err})
			} else if(newFriend === null) {
				res.status(404).json({message: "User not fond. Wrong friend_id? "})
			} else {
				var user = newFriend.friends.find(friend => friend.friend.equals(req.user._id));
				if(user) {
					user.status = 0;
					newFriend.save();
					User.findById(req.user._id, (err, currentUser) => {
						if(err) {
							res.status(500).json({message: "Database error " + err})
						} else if(currentUser === null) {
							res.status(404).json({message: "User not found. Bad token? "})
						} else {
							var user2 = currentUser.friends.find(friend2 => friend2.friend.equals(newFriend._id));
							if(user2) {
								user2.status = 0;
								currentUser.save();
								res.status(200).json({message: "Friend request confirmed!"})
							} else {
								res.status(404).json({message: "This user is not in your friends requests list!"})
							}
						}
					})
				} else {
					res.status(404).json({message: "Your are not in his friends requests list!"})
				}
			}
		})
		
	}
}

const get_friends_list = (req, res) => {
	User.findById(req.user._id, "friends" )
	.populate({path: "friends.friend", select: "-friends -password"})
	.then(friends => {
		res.status(200).json({message: "Successfully retrieved friends list!", data: friends})
	})
	.catch(e => {
		res.status(500).json({message: "Database error: " + e})
	})
}

const get_friends_suggestions = (req, res) => {
	User.findById(req.user._id)
	.then(currentUser => {
		var search = req.query.search_word ? {_id: {$nin: [...currentUser.friends.map(x => x.friend), req.user._id]},
											  username: { $regex: "^" + req.query.search_word, $options: 'i'}}
										   : {_id: {$nin: [...currentUser.friends.map(x => x.friend), req.user._id]}};
		User.find(search)
		.then(users => {
			res.status(200).json({message: "Successfully got friends suggestions", data: users})
		})
		.catch(err => {
			res.status(500).json({message: "Database error: " + err})
		})
	})
	.catch(e => {
		res.status(500).json({message: "Database error: " + e})
	})
}

// cons send_seen_event = (req,res) => {
	
// }

const extractDataMiddleware = (req, res, next) => {
	if (req.token_payload.username) {
		User.findOne({username: req.token_payload.username}, (err, currentUser) => {
			if(err) {
				res.status(404).json({ message: "Missing user. Bad token?" })
			} else {
				req.user = currentUser;
				next();
			}
		})
	} else {
		res.status(404).json({ message: "Missing user field" })
	}
}

const authMiddleware = (req, res, next) => {
	if (req.headers["token"]) {
		JWT.verify(req.headers["token"], CONFIG.JWT_SECRET_KEY, (err, payload) => {
			if (err) {
				res.status(403).json({ message: "Invalid token" })
			} else {
				req.token_payload = payload;
				next();
			}
		})
	} else {
		res.status(403).json({ message: "Missing login token" })
	}
}

const test = (req, res) => {
	var query = req.query.search_word
	res.status(200).json({query})
	// const friend_id = newFunction(); 
	// User.findById(friend_id).exec((err, result) => console.log(result.friends.find( friend => friend.email === "test@gmail.com")))
	// .then(response => {
	// 	User.findOne({ email: response.email})
		// .then(result => {
		// 	console.log(result, friend.$)
		// })
		// .catch(err => {
		// 	console.log(err)
		// })
	// })
	
}

module.exports = {
	register,
	login,
	get_my_data,
	authMiddleware,
	extractDataMiddleware,
	send_friend_request,
	confirm_friend_request,
	get_friends_list,
	get_friends_suggestions,
	test
}
