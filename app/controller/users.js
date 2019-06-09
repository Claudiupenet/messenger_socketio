const JWT = require('jsonwebtoken');

const User = require('../models/user');
const Conversation = require('../models/conversation');
const CONFIG = require("../config");

const register = (req, res) => {
	if (req.body && req.body.email && req.body.password && req.body.firstName && req.body.lastName) {
		var newUser = new User({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			password: req.body.password
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
	if (req.body && req.body.email && req.body.password) {
		User.findOne({
			email: req.body.email,
			password: req.body.password
		})
			.then(result => {
				if (result == null) {
					res.status(401).json({ message: "Wrong combination" })
				} else {
					var TOKEN = JWT.sign({
						email: req.body.email,
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

	res.status(200).json({ firstname: req.user.firstName, lastName: req.user.lastName, email: req.user.email, picture: req.user.picture})
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
					var conversation = new Conversation({participants: [req.user._id, friendWannaBe._id], 
															unseen: friendWannaBe._id, 
															messages: [{author: req.user._id, 
																		message: req.user.firstName + ' ' + req.user.lastName + ' sent a friend request', 
																		timestamp: Date.now()}]});
					conversation.save((error, callback) => {
						if(error) {
							res.status(500).json({message: "Error at saving convesation"})
						} else {

							friendWannaBe.friends.push({friend: req.user._id, status: 1, conversation: callback._id});
							friendWannaBe.newActivity.push(friendWannaBe.friends[friendWannaBe.friends.length -1].id)
							friendWannaBe.save((e) => {
								if(e) {
									res.status(500).json({message: "Error at adding friend request " + e})
								} else {

									if(req.user.friends.find(friend => friend.friend.equals(friendWannaBe._id)) === undefined) {
										req.user.friends.push({friend: friendWannaBe._id, status: 2, conversation: callback._id})
										req.user.save()
										res.status(200).json({message: "Friend request sent!"})
									} else {
										res.status(409).json({message: "Already friend or request sent/received!"})
									}

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

	if (!req.body.friend_id || (req.body.answer === undefined)) {
		res.status(400).json({ message: "Please provide friend_id and answer!" })
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
				if(user && user.status === 2) {
					if(req.body.answer === true) {

						user.status = 0;
						newFriend.newActivity.push(user._id);
						Conversation.findByIdAndUpdate(user.conversation, 
							{"$set": {unseen: newFriend._id}, 
							"$push": {messages: {author: req.user._id, 
												message: req.user.firstName + ' ' + req.user.lastName + ' has accepted friend request!', 
												timestamp: Date.now()}}} , (err) => {
							if(err) {
								res.status(500).json({message: "Error at updating conversation unseen " + err})
							}
						})
						newFriend.save((e) => {
							if(e) {
								res.status(500).json({message: "Error at confirming friend request " + e})
							} else {
								var user2 = req.user.friends.find(friend2 => friend2.friend.equals(newFriend._id));
								if(user2) {
		
									user2.status = 0;
									req.user.save();
									res.status(200).json({message: "Friend request confirmed!"})
								} else {
									res.status(404).json({message: "This user is not in your friends requests list!"})
								}

							}
						});
					} else {
						var newFriends = newFriend.friends.filter(friend => !friend.friend.equals(req.user._id));
						newFriend.friends = newFriends;
						newFriend.save(e => {
							if(e) {

								res.status(500).json({message: "Error at removing friend request " + e})
							} else {
								var friendsNew = req.user.friends.filter(friend => !friend.friend.equals(newFriend._id));
								req.user.friends = friendsNew;
								req.user.save(e => {
									if(e) {
										res.status(500).json({message: "Error at removing friend request " + e})
									} else {
										res.status(200).json({message: "Successfully removed friend request!"})
									}
								})

							}
						})
					}		
						
				} else {
					res.status(404).json({message: "Your are not in his friends requests list or you have already confirmed!"})
				}
			}
		})
		
	}
}

const get_friends_list = (req, res) => {
	
	res.status(200).json({message: "Successfully retrieved friends list!", friends: req.user.friends})
}

const get_conversations_list = (req, res) => {
	User.findById(req.user._id)
	.populate({path: "friends.friend", select: "firstName lastName picture"})
	.populate('friends.conversation', 'messages')
	.lean()
	.exec((err, currentUser) => {
		if(err) {
			res.status(500).json({ message: "Error at retrieving conversations list " + err })
		} else if(currentUser === null) {
			res.status(404).json({message: "Missing user. Bad token?"})
		} else {
				var friends = currentUser.friends.map(friend => {
					var last_message = friend.conversation.messages[friend.conversation.messages.length -1];
					delete friend.conversation.messages;
					friend.conversation.last_message = last_message;
					return friend;
				})
				if(friends.length > 1) {
					friends.sort((a, b) => {

						return a.conversation.last_message.timestamp > b.conversation.last_message.timestamp ? -1 : 
								a.conversation.last_message.timestamp < b.conversation.last_message.timestamp ? 1 : 0;
					})
				}
				req.user.newActivity = [];
				req.user.save(e => {
					if(e) {
						res.status(500).json({message: "Error at reading new activity " + e})
					} else {
						
						res.status(200).json({message: "Successfully retrieved conversations list!", conversations: friends})
					}
				})
		}
	})
}

const get_friends_requests = (req, res) => {
	
	var friends_requests = req.user.friends.filter( friend => friend.status === 1);
	if(friends_requests.length === 0) {
		res.status(200).json({message: "You have no friends requests!"})
	}
	res.status(200).json({message: "Successfully retrieved friends requests!", data: friends_requests})
}

const get_friends_suggestions = (req, res) => {

	var search = req.query.search_word ? {_id: {$nin: [...req.user.friends.map(x => x.friend), req.user._id]},
											$or: [{firstName: { $regex: "^" + req.query.search_word, $options: 'i'}},
												{lastName: { $regex: "^" + req.query.search_word, $options: 'i'}}]}
										
										: {_id: {$nin: [...req.user.friends.map(x => x.friend), req.user._id]}};
	User.find(search)
	.then(users => {
		res.status(200).json({message: "Successfully got friends suggestions", data: users})
	})
	.catch(err => {
		res.status(500).json({message: "Database error: " + err})
	})

}

// de optimizat - acum trimite cate un nou eveniment la fiecare cerere
const check_activity = (req, res) => {
	if(req.user.newActivity.length > 0) {

		var myFriendship = req.user.friends.id(req.user.newActivity[0]).toObject();
		Conversation.findById(myFriendship.conversation, 'messages')
		.lean()
		.exec((error, conversation) => {
			if(error) {
				res.status(500).json({message: "Error at geting conversation from newActivity " + error})
			} else {
				var last_message = conversation.messages[conversation.messages.length -1];
				myFriendship.conversation = conversation;
				delete myFriendship.conversation.messages;
				myFriendship.conversation.last_message = last_message;
				req.user.newActivity.shift();
				req.user.save();
				res.status(200).json({message: "New activity!", conversations: myFriendship})
			}
		})


	} else {
		res.sendStatus(204);
	}
}

const extractDataMiddleware = (req, res, next) => {
	if (req.token_payload.email) {
		User.findOne({email: req.token_payload.email})
		.populate({path: "friends.friend", select: "firstName lastName picture"})
		.exec((err, currentUser) => {
			if(err) {
				res.status(404).json({ message: "Error at retrieving user information " + err })
			} else if(currentUser === null) {
				res.status(404).json({message: "Missing user. Bad token?"})
			} else {

				req.user = currentUser;
				next();
			}
		})
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
	req.user.friends.push({friend: "5cfab87b725f8e1104752dcd", status: 6, conversation: "5cfac3af2591c82048c8d8ff"})
	var aidi = req.user.friends[req.user.friends.length -1].id;
	console.log(aidi)
	res.status(200).json(req.user)
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
	get_friends_requests,
	get_conversations_list,
	check_activity,
	test
}
