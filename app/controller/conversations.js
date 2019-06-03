const Conversation = require('../models/conversation')

const get_conversation = (req, res) => {

    res.status(200).json({message: "Conversation retrieved successfully!", conversation: req.conversation})
}

const add_message = (req, res) => {
    if(!req.body.message) {
        res.status(400).json({message: "Please provide a message!"})
    } else {
        req.conversation.messages.push({author: req.user._id, message: req.body.message, seen: false, date: Date.now()})
        req.conversation.save();
        res.status(200).json({message: "Message added!"})
    }
}

const extract_conversation = (req, res, next) => {
    if(!req.body.conversation_id) {
        res.status(400).json({ message: "Please provide conversation_id!" })
    } else {
        Conversation.findById(req.body.conversation_id)
            .populate({path: 'participants', select: 'username email picture'})
            .exec((err, conversation) => {
            if(err) {
                res.status(500).json({message: "Error at retrieving conversation " + err})
            } else if (conversation === null){
                res.status(404).json({message: "Conversation not found! Maybe wrong conversation_id?"})
            } else {
                if(conversation.participants.some(participant => participant._id.equals(req.user._id)) === false) {
                    res.status(403).json({message: "You can only see your convesations!"})
                } else {
                    req.conversation = conversation;
                    next();
                }
            }
        })
    }
}

module.exports = {
    get_conversation,
    extract_conversation,
    add_message
}