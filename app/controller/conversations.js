const Conversation = require('../models/conversation');
const User = require('../models/user');

const get_conversation = (req, res) => {
    
    var conversation = req.conversation.toObject();
    conversation.friend = conversation.participants.find(participant => !participant._id.equals(req.user._id));
    delete conversation.participants;
    
    res.status(200).json({ message: "Conversation retrieved successfully!", conversation: conversation })
}

const add_message = (req, res) => {
    if (!req.body.message) {
        res.status(400).json({ message: "Please provide a message!" })
    } else if(req.conversation.participants.includes(req.user._id)) {
        res.status(403).json({message: "You can't add messages to this conversation!"})
    } else {
        var friend = req.conversation.participants.find(participant => !participant._id.equals(req.user._id));
        if (!friend) {
            res.status(400).json({ message: "Something wen't wrong. Bad token?" })
        } else {
            User.findById(friend._id, (error, currentFriend) => {
                if (error) {
                    res.status(500).json({ message: "Database error at retrieving friend " + error })
                } else {
                    var friendship = currentFriend.friends.find(friend => friend.friend.equals(req.user._id));
                   if(currentFriend.newActivity.includes(friendship._id)) {
                       currentFriend.newActivity =  currentFriend.newActivity.filter(x => !x.equals(friendship._id))
                    }
                    currentFriend.newActivity.push(friendship._id);

                    currentFriend.save((err) => {
                        if (error) {
                            req.status(500).json({ message: "Error at setting seen event " + err })
                        } else {
                            req.conversation.messages.push({ author: req.user._id, message: req.body.message, timestamp: Date.now() });
                            req.conversation.unseen = currentFriend._id;
                            req.conversation.save(e => {
                                if (e) {
                                    res.status(500).json({ message: "Error at adding new message!" } + e)
                                } else {
                                    res.status(200).json({ message: "Message added!", newMessage: req.conversation.messages[req.conversation.messages.length -1] })
                                }
                            })
                        }
                    })
                }
            })
        }
    }
}

const send_seen_event = (req, res) => {
    var isParticipant = req.conversation.participants.find( participant => participant._id.equals(req.user._id));
    if(isParticipant && req.conversation.unseen.equals(req.user._id)) {

        req.conversation.unseen = null;
        req.conversation.save(err => {
            if(err) {
                res.status(500).json({message: "Error at sending seen event " + err})
            } else {
                res.status(200).json({message: "Successfully sent seen event!"})
            }
        })
    } else {
        res.status(403).json({message: "You can't send seen event to this conversation!"})
    }
}

const extract_conversation = (req, res, next) => {
    if (!req.headers['conversation_id']) {
        res.status(400).json({ message: "Please provide conversation_id!" })
    } else {
        Conversation.findById(req.headers['conversation_id'])
            .populate({ path: 'participants', select: 'firstName lastName email picture description phone' })
            .exec((err, conversation) => {
                if (err) {
                    res.status(500).json({ message: "Error at retrieving conversation " + err })
                } else if (conversation === null) {
                    res.status(404).json({ message: "Conversation not found! Maybe wrong conversation_id?" })
                } else {
                    if (conversation.participants.some(participant => participant._id.equals(req.user._id)) === false) {
                        res.status(403).json({ message: "You can only see your convesations!" })
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
    add_message,
    send_seen_event
}