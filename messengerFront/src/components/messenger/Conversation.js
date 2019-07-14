import React from 'react';
import {Col, Input, InputGroup, InputGroupAddon, Button} from 'reactstrap';
import FriendInfo from './FriendInfo';
import Messages from './Messages';

const Conversation = ({conversation, updateData, send_message, message, close_conversation, user, logout}) => {
    const get_input = () => {
        if(!conversation) {
            return;
        }
        if (conversation && conversation.messages.length === 1) {
             if(conversation.messages[0].author === conversation.friend._id) {
                 return (<> <InputGroup id="send-message" onKeyPress={(e) => {if(e.key === "Enter") send_message(e)}}>
                                <Input type="text" id="input-message" name="message" onChange={updateData} value={message} required minLength="1" maxLength="500" 
                                    placeholder="You must accept friend request before you can talk to this person" disabled />
                                    <InputGroupAddon addonType="append">
                                        <Button color="primary" onClick={(e) => send_message(e)} disabled>Send</Button>
                                    </InputGroupAddon>
                                </InputGroup> </>)
                } else {
                    return (<> <InputGroup id="send-message" onKeyPress={(e) => {if(e.key === "Enter") send_message(e)}}>
                                    <Input type="text" id="input-message" name="message" onChange={updateData} value={message} required minLength="1" maxLength="500" 
                                        placeholder="You must wait for your friend to accept your request" disabled />
                                    <InputGroupAddon addonType="append">
                                        <Button color="primary" onClick={(e) => send_message(e)} disabled>Send</Button>
                                    </InputGroupAddon>
                                </InputGroup> </>)
                   
             }
        } else {
            return (<>  <InputGroup id="send-message" onKeyPress={(e) => {if(e.key === "Enter") send_message(e)}}>
                            <Input type="text" id="input-message" name="message" onChange={updateData} value={message} required minLength="1" 
                                maxLength="500" placeholder="Type your message here..." />
                            <InputGroupAddon addonType="append">
                                <Button color="primary" onClick={(e) => send_message(e)}>Send</Button>
                            </InputGroupAddon>
                        </InputGroup> </>)
        }
                            
    }

    return(<>
        <Col sm='6' className="border p-0 m-0 h-100">
            <div className="border text-center messenger-title">
                <h4 className="mt-2">{ conversation && conversation.friend 
                    ? (conversation.friend.firstName + " " + conversation.friend.lastName) 
                    : "Conversation"}
                </h4>
                {conversation && <Button close id='close-conversation' onClick={close_conversation} />}
            </div>
            <div className="messages-list overflow-auto mt-3">
                {(conversation && <Messages conversation={conversation} />) || <h4 className="text-center mt-5">Click on a conversation to display here</h4>}
            </div>
            {get_input()}
        </Col>
        <Col sm='3' className="friend-info w-100 d-flex align-items-center justify-content-center">          
            { (conversation && <FriendInfo friend={conversation.friend} />) 
            || <h5 className="text-center mt-5">Friend info here</h5>}
        </Col>
        
    </>);
}

export default Conversation;