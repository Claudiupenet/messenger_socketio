const mongoose = require('mongoose');
const CONFIG = require('../config');
var ObjectId = mongoose.Schema.Types.ObjectId;

var ConversationSchema = new mongoose.Schema({
	participants: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	unseen: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	messages: [{author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, message: String, timestamp: Date }]
}, {
		versionKey: false,		
	})
		
var Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;