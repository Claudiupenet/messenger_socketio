const JWT = require('jsonwebtoken');
const bcrypt = require ('bcrypt');
const nodemailer = require('nodemailer');
const secret_key = process.env.SECRET || CONFIG.JWT_SECRET_KEY;

const User = require('../models/user');
const Conversation = require('../models/conversation');
const CONFIG = require("../config");

module.exports = io => {

	var connected_users = [];
	io.on('connection', socket => {

		socket.user = false;

		new_activity = (participants, activity) => {

			participants.map(participant => {
				var isOnline = connected_users.find(user => user.user_id.equals(participant));
				if(isOnline) {
					io.to(isOnline.socket_id).emit('new_activity', activity)
				}
			})
		}

		socket.on('register', data => {
			if (data && data.email && data.password && data.firstName && data.lastName) {
				User.findOne({email: data.email}, (err, user) => {
					if(err) {
						console.log(err)
						socket.emit('register', 'dberror');
						return;
					} else if(user) {
						socket.emit('register', 'conflict')
						return;
					} else {
						bcrypt.hash(data.password, 10, (error, hashed_password) => {
							if(error) {
								console.log(error)
								socket.emit('register', 'hashing error');
								return;
							} else {
								var newUser = new User({
									firstName: data.firstName,
									lastName: data.lastName,
									email: data.email,
									password: hashed_password
								})
						
								newUser.save((err, result) => {
									if (err) {
										console.log(err);
										socket.emit('register', 'dberror');
									} else {
										socket.emit('register', 'ok');
									}
								})
							}
						})
					}
				})
			} else {
				socket.emit('register', 'incomplete')
			}
		})

		socket.on('login', data => {
			if (data && data.email && data.password) {
				User.findOne({email: data.email})
					.then(user => {
						if (user == null) {
							socket.emit('login', 'notfound');
						} else {
							bcrypt.compare(data.password, user.password, (error, success) => {
								if(error) {
									socket.emit('login', 'bcrypterror');
								} else if (success){
		
									var TOKEN = JWT.sign({
										email: data.email,
										exp: Math.floor(Date.now() / 1000) + CONFIG.JWT_EXPIRE_TIME
									},secret_key);
									socket.user = user;
									const {friends, password, ...rest} = user.toObject();
									socket.emit('login', {token: TOKEN, user: rest});
									connected_users.push({socket_id: socket.id, user_id: user._id})
									socket.broadcast.emit('online_status', {user_id: user._id, status: true})
								} else {
									socket.emit('login', 'wrongpassword');
								}
							})
						}
					})
			} else {
				socket.emit('login', 'incomplete');
			}
		})

		socket.on('login_using_token', data => {
			if(data.token) {
				JWT.verify(data.token, secret_key, (err, payload) => {
								if (err) {
									socket.emit('login_using_token', 'badtoken')
								} else {
									User.findOne({email: payload.email})
									.then(user => {
										if(user === null) {
											socket.emit('login_using_token', 'badtoken')
										} else {
											socket.user = user;
											const {friends, password, ...rest} = user.toObject();
											socket.emit('login_using_token', {user: rest})
											connected_users.push({socket_id: socket.id, user_id: user._id})
											socket.broadcast.emit('online_status', {user_id: user._id, status: true})
										}
									})
								}
							})
			}
		})

		socket.on('get_conversations_list', () => {

			if(socket.user) {
				User.findById(socket.user._id)
				.populate({path: "friends.friend", select: "firstName lastName picture isOnline"})
				.populate('friends.conversation', 'messages unseen')
				.lean()
				.exec((err, currentUser) => {
					if(err) {
						socket.emit('get_conversations_list', 'dberror')
					} else if(currentUser === null) {
						socket.emit('get_conversations_list', 'error')
					} else {
						var friends = currentUser.friends.map(friend => {
							var last_message = friend.conversation.messages[friend.conversation.messages.length -1];
							friend.friend.isOnline = connected_users.some(user => user.user_id.equals(friend.friend._id));
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
						
						socket.emit('get_conversations_list', {conversations: friends})

					}
				})
			}
		})

		socket.on('get_friends_suggestions', (data) => {
			if(socket.user) {
				User.findById(socket.user._id, (err, currentUser) => {
					if(err) {
						socket.emit('get_friends_suggestions', 'dberror')
					} else {
						var search = data !== '' ? {_id: {$nin: [...currentUser.friends.map(x => x.friend), currentUser._id]},
																$or: [{firstName: { $regex: "^" + data, $options: 'i'}},
																	{lastName: { $regex: "^" + data, $options: 'i'}}]}
															
															: {_id: {$nin: [...currentUser.friends.map(x => x.friend), currentUser._id]}};
						User.find(search, "-newActivity -friends")
						.then(users => {
							socket.emit('get_friends_suggestions', {friends_suggestions: users})
						})
						.catch(err => {
							socket.emit('get_friends_suggestions', 'dberror')
						})
					}
				})
			}
		})

		socket.on('send_friend_request', data => {
			if(!socket.user) {
				socket.emit('send_friend_request', 'forbidden');
				return;
			}
			if (!data.friend_id) {
					socket.emit('send_friend_request', 'incomplete')
				} else if (socket.user._id.equals(data.friend_id)) {
					socket.emit('send_friend_request', 'You cannot send a friend request to yourself!')
				} else {
					User.findById(data.friend_id, (error, friendWannaBe) => {
						if(error) {
							socket.emit('send_friend_request', 'dberror')
						} else if (friendWannaBe === null) {
							socket.emit('send_friend_request', 'badId')
						} else {
			
							if(friendWannaBe.friends.find(friend => friend.friend.equals(socket.user._id)) === undefined) {
								var conversation = new Conversation({participants: [socket.user._id, friendWannaBe._id], 
																		unseen: friendWannaBe._id, 
																		messages: [{author: socket.user._id, 
																					message: socket.user.firstName + ' ' + socket.user.lastName + ' sent a friend request', 
																					timestamp: Date.now()}]});
								conversation.save((error, callback) => {
									if(error) {
										socket.emit('send_friend_request', 'dberror')
									} else {
			
										friendWannaBe.friends.push({friend: socket.user._id, status: 1, conversation: callback._id});
										friendWannaBe.save((e) => {
											if(e) {
												socket.emit('send_friend_request', 'dberror')
											} else {
												if(socket.user.friends.find(friend => friend.friend.equals(friendWannaBe._id)) === undefined) {
													socket.user.friends.push({friend: friendWannaBe._id, status: 2, conversation: callback._id})
													socket.user.save()
													socket.emit('send_friend_request', {id: data.friend_id, message: 'success'})
												} else {
													socket.emit('send_friend_request', 'conflict')
												}
			
											}
										})
			
									}
								})
							} else {
								socket.emit('send_friend_request', 'conflict')
							}
						}
			
					})
			
				}
		})

		socket.on('confirm_friend_request', data => {
			if(socket.user) {

				if (!data.friend_id || (data.answer === undefined)) {
					socket.emit('confirm_friend_request', 'incomplete')
					} else if(socket.user._id.equals(data.friend_id)) {
						socket.emit('confirm_friend_request', 'forbidden')
					} else {
				
						User.findById(data.friend_id, (error, newFriend) => {
							if(error) {
								socket.emit('confirm_friend_request', 'dberror')
							} else if(newFriend === null) {
								socket.emit('confirm_friend_request', 'badId')
							} else {
								var user = newFriend.friends.find(friend => friend.friend.equals(socket.user._id));
								if(user && user.status === 2) {
									if(data.answer === true) {
				
										user.status = 0;
										Conversation.findByIdAndUpdate(user.conversation, 
											{"$set": {unseen: newFriend._id}, 
											"$push": {messages: {author: socket.user._id, 
																message: socket.user.firstName + ' ' + socket.user.lastName + ' has accepted friend request!', 
																timestamp: Date.now()}}} , (err) => {
											if(err) {
												socket.emit('confirm_friend_request', 'dberror')
											}
										})
										newFriend.save((e) => {
											if(e) {
												socket.emit('confirm_friend_request', 'dberror')
											} else {
												var user2 = socket.user.friends.find(friend2 => friend2.friend.equals(newFriend._id));
												if(user2) {
						
													user2.status = 0;
													socket.user.save();
													socket.emit('confirm_friend_request', 'success')
												} else {
													socket.emit('confirm_friend_request', 'forbidden')
												}
				
											}
										});
									} else {
										Conversation.findByIdAndRemove(user.conversation, (err) => {
											if(err) {
												socket.emit('confirm_friend_request', 'dberror')
											} else {
				
												var newFriends = newFriend.friends.filter(friend => !friend.friend.equals(socket.user._id));
												newFriend.friends = newFriends;
												newFriend.save(e => {
													if(e) {
						
														socket.emit('confirm_friend_request', 'dberror')
													} else {
														var friendsNew = socket.user.friends.filter(friend => !friend.friend.equals(newFriend._id));
														socket.user.friends = friendsNew;
														socket.user.save(e => {
															if(e) {
																socket.emit('confirm_friend_request', 'dberror')
															} else {
																socket.emit('confirm_friend_request', 'success')
															}
														})
						
													}
												})
											}
										})
									}		
										
								} else {
									socket.emit('confirm_friend_request', 'forbidden')
								}
							}
						})
						
					}
			}
		})

		socket.on('get_conversation', data => {
			if(socket.user) {
				Conversation.findById(data)
				.populate({path: "participants", select: "firstName lastName email age sex picture isOnline description phone"})
				.then(conv => {
					if(conv.participants.some(user => user._id.equals(socket.user._id))) {
						var conversation = conv.toObject();
						conversation.friend = conversation.participants.find(x => !x._id.equals(socket.user._id));
						conversation.friend.isOnline = connected_users.some(user => user.user_id.equals(conversation.friend._id));
						delete conversation.participants;
						socket.emit('get_conversation', {message: 'success', conversation})
					} else {
						socket.emit('get_conversation', 'forbidden')
					}
				})
				.catch(error => {
					console.log(error)
					socket.emit('get_conversation', 'dberror')
				}) 
			}
		})

		socket.on('send_seen_event', data => {

			Conversation.findById(data, (err, conversation) => {
				if(err) {
					console.log(err)
					socket.emit('send_seen_event', 'dberror')
				} else {
					var isParticipant = conversation.participants.find( participant => participant.equals(socket.user._id));
					if(isParticipant) {
						if(conversation.unseen && conversation.unseen.equals(socket.user._id)) {
					
							conversation.unseen = null;
							conversation.save(err => {
								if(err) {
									console.log(err)
									socket.emit('send_seen_event', 'dberror')
								} else {
									socket.emit('send_seen_event', {message: 'success', id: conversation._id})
								}
							})
						} else {
							socket.emit('send_seen_event',  {message: 'success', id: conversation._id})
						}
					} else {
						socket.emit('send_seen_event', 'forbidden')
					}
				}
			})
		})

		socket.on('add_message', data => {
			if(!data.message || !data.conversation_id) {
				socket.emit('add_message', 'incomplete')
				return;
			} else {
				Conversation.findById(data.conversation_id, (err, conversation) =>{

					if(err) {
						console.log(err);
						socket.emit('add_message', 'dberror')
					} else {

						if(!conversation.participants.includes(socket.user._id)) {
							socket.emit('add_message', 'forbidden')
						} else {
							conversation.unseen = conversation.participants.find( p => !p.equals(socket.user._id))._id;
							conversation.messages.push({ author: socket.user._id, message: data.message, timestamp: Date.now() });
							conversation.save(e => {
								if (e) {
									console.log(e)
									socket.emit('add_message', 'dberror')
								} else {
									new_activity(conversation.participants, {type: 'message', conversation: conversation._id, message: conversation.messages[conversation.messages.length -1]})
								}
							})
						}
										
					}
				})
			}
		})

		socket.on('forgot_password', data => {
			if(!data) {
				socket.emit('forgot_password', 'incomplete');
			} else {
				User.findOne({email: data},'password', (error, user) => {
					if(error) {
						console.log(error)
						socket.emit('forgot_password', 'dberror')
					} else {
						if(!user) {
							socket.emit('forgot_password', 'notfound')
						} else {
							var smtpConfig = {
								service: 'Gmail',
								host: 'smtp.gmail.com',
								port: 465,
								secure: true,
								auth: {
									user: "claudiukambi@gmail.com",
									pass: "Messenger#@!"
								}
							}
							var token = JWT.sign({key: user.password, email: data}, secret_key);
		
							var mailOption = {
								from: "claudiukambi@gmail.com",
								to: data,
								subject: "Recover password token",
								text: "Click on this link to reset your password",
								html: "<p> <a href='http://localhost:3000/reset/"+token+"'> Click here to reset your password</a></p>"
							}
							var transporter = nodemailer.createTransport(smtpConfig);
		
							transporter.sendMail(mailOption, (err, info) => {
								if (err) {
									console.log(err)
									socket.emit('forgot_password', 'Error when sending email')
								} else {
									socket.emit('forgot_password', 'success')
								}
							})
						}
					}
				})
			}
		})

		socket.on('reset_password', data => {
			if(!data.token || !data.password) {
				socket.emit('reset_password', 'incomplete')
			} else {
				JWT.verify(data.token, secret_key, (err, payload) => {
					if(err) {
						socket.emit('reset_password', 'badToken')
					} else {
						User.findOne({email: payload.email}, 'password', (err, user) => {
							if(err) {
								console.log(err)
								socket.emit('reset_password', 'dberror')
							} else if(!user) {
								socket.emit('reset_password', 'badToken')
							} else {
								if(payload.key === user.password) {
									bcrypt.hash(data.password,10,(err, hashed_password) => {
										if(err) {
											console.log(err);
											socket.emit('reset_password', 'Error when updating password')
										} else {
											user.password = hashed_password;
											user.save((error) => {
												if(error) {
													console.log(error);
													socket.emit('reset_password', 'dberror')
												} else {
													socket.emit('reset_password', 'success')
												}
											})
										}
									})
								} else {
									socket.emit('reset_password', 'badToken')
								}
							}
						})
					}
				})
			}
		})

		socket.on('update_profile', data => {
			User.findById(data._id, (err, user) => {
				if(err) {
					console.log(err);
					socket.emit('update_profile', 'dberror')
				} else {

					if(data.password !== '') {
							user.password = bcrypt.hashSync(data.password, 10);
						}
					user.firstName = data.firstName;
					user.lastName = data.lastName;
					user.description = data.description;
					if(data.age !== '') {
						user.age = data.age
					} else {
						user.age = null;
					}
					if(data.sex !== '') {
						user.sex = data.sex
					} else {
						user.sex = null;
					}
					user.phone = data.phone;
					user.picture = data.picture;
					user.save(err => {
						if(err) {
							console.log("Error at updating profile " + err)
							socket.emit('update_profile', 'dberror')
						} else {
							const {friends, password, ...rest} = user.toObject();
							socket.emit('update_profile', {message: 'success', user: rest})
						}
					})
				}
			})
		})

		socket.on('disconnect', () => {
			var user = connected_users.find( user => user.socket_id === socket.id);
			if(user) {
				console.log(user)
				socket.broadcast.emit('online_status', {user_id: user.user_id, status: false});
			}
			connected_users = connected_users.filter(user => user.socket_id !== socket.id);
		})
	})
	
}
