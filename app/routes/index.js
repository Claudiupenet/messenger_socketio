const express = require('express');
const User_controller = require('../controller/users');
const Conversation_controller = require('../controller/conversations');

const router = express.Router();

router.get('/healthcheck', (req, res) => {
	res.status(200).json({message: "Server is alive"})
})

router.post("/register", User_controller.register);
router.post("/login", User_controller.login);
router.use("/user", User_controller.authMiddleware);
router.use("/user", User_controller.extractDataMiddleware);
router.post("/user/login_using_token", User_controller.login_using_token);
router.get('/user/check_activity', User_controller.check_activity);
router.get('/user/get_my_data', User_controller.get_my_data);
//router.get('/user/test/:test', User_controller.test);
router.get('/user/test/', User_controller.test);
router.get('/test/', User_controller.test_without_login);
router.post('/user/send_friend_request', User_controller.send_friend_request);
router.post('/user/confirm_friend_request', User_controller.confirm_friend_request);
router.get('/user/get_friends_list', User_controller.get_friends_list);
router.get('/user/get_conversations_list', User_controller.get_conversations_list)
router.get('/user/get_friends_requests', User_controller.get_friends_requests);
router.get('/user/get_friends_suggestions', User_controller.get_friends_suggestions);
router.use('/user/conversations', Conversation_controller.extract_conversation);
router.get('/user/conversations/get_conversation', Conversation_controller.get_conversation);
router.post('/user/conversations/add_message', Conversation_controller.add_message);
router.post('/user/conversations/send_seen_event', Conversation_controller.send_seen_event);

module.exports = router;