const Conversation = require('../models/conversation');
const User = require('../models/user');

const get_conversation = (req, res) => {
    if(!req.conversation.participants.includes(req.user._id)) {
        res.status(403).json({message: "You cannot see others conversations!"})
    } else {
        res.status(200).json({message: "Conversation retrieved successfully!", conversation: req.conversation})
    }
}

const add_message = (req, res) => {
    if(!req.body.message) {
        res.status(400).json({message: "Please provide a message!"})
    } else {
        var friend = req.conversation.participants.find(participant => !participant._id.equals(req.user._id));
        if(!friend) {
            res.status(400).json({message: "Something wen't wrong. Bad token?"})
        } else {
            User.findById(friend._id, (error, currentFriend) => {
                if(error) {
                    res.status(500).json({message: "Database error at retrieving friend " + error})
                } else {
                    var friendship = currentFriend.friends.find( friend => friend.friend.equals(req.user._id));
                    friendship.last_activity = false;
                    
                    currentFriend.save((err) => {
                        if(error) {
                            req.status(500).json({message: "Error at setting seen event " + err})
                        } else {

                            req.conversation.messages.push({author: req.user._id, message: req.body.message, timestamp: Date.now()});
                            req.conversation.save();
                            res.status(200).json({message: "Message added!"})
                        }
                    })
                   // res.status(200).json({friend: friend, currentFriend: currentFriend})
                }
            })
        }
        
    }
}



const extract_conversation = (req, res, next) => {
    if(!req.body.conversation_id) {
        res.status(400).json({ message: "Please provide conversation_id!" })
    } else {
        Conversation.findById(req.body.conversation_id)
            .populate({path: 'participants', select: 'firstName lastName email picture'})
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