import React from 'react';
import {Button} from 'reactstrap';
import Moment from 'react-moment';
const Friend = ({conversation: {friend, conversation}, get_conversation, confirm_request}) => {
    return(
        <li className={ (conversation.unseen && (conversation.unseen !== friend._id) ? "unseen" : '') + " friend clearfix"} onClick={() => get_conversation(conversation._id)}>
            <img src={ friend.picture || "/img/avatar.png"} alt="user avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}}/>
            <span className={ (friend.isOnline === true ? "online-friend" : '') + " online-status"}></span>
            <div className="font-weight-bold friend-name">
                {friend.firstName + " " + friend.lastName}
            </div>
            <div className="text-muted last-message">
                {conversation.last_message.author !== friend._id 
                    ? "You: " 
                    : (conversation.last_message.message === friend.firstName + ' ' + friend.lastName + ' sent a friend request') 
                        ? <><Button className="add-friend-button" color="primary" size="sm" onClick={() => confirm_request(friend._id, true)}>Confirm</Button>
                        <Button className="cancel-request-button" color="danger" size="sm" onClick={() => confirm_request(friend._id, false)}>Cancel</Button></>
                        : null } {conversation.last_message.message.substring(0, 30)}
            </div>
            <small className="time text-muted"><Moment fromNow>{conversation.last_message.timestamp}</Moment></small>
        </li>
    );
}

export default Friend;