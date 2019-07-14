import React from 'react';
import Moment from 'react-moment';

const Messages = ({conversation}) => {
    return(
        <>
            {conversation.messages && conversation.messages.map((message, index) => {
                if(index < 2) {
                    return <h6 className="text-center" key={message._id}>{message.message}</h6>
                } else {
                    return (
                        <div className={(message.author !== conversation.friend._id ? 'own-message text-right ' : '') + "message"} key={message._id} id={index}>
                            { (message.author === conversation.friend._id) && <img src={conversation.friend.picture || '/img/avatar.png'} alt="user avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}} className="friend-message-avatar" />}
                            <p className="message-text text-left">
                            <small className="text-nowrap message-details">
                                <Moment fromNow>{message.timestamp}</Moment>
                                    {conversation.friend._id === message.author ? ' ' + conversation.friend.firstName: ' you '} said...
                            </small>{message.message}</p>
                        </div>)
                }
            })}
            <div id="dummy"/>
        </>
    );
}

export default Messages;