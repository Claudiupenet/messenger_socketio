import React from 'react';
import {Row} from 'reactstrap';
import Friends from './messenger/Friends';
import Conversation from './messenger/Conversation';

class Messenger extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            token: null,
            conversations: [],
            friends_suggestions: [],
            current_conversation: null,
            message: '',
            search_friends_suggestions: ''
        }
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        const socket = this.props.appData.socket;
        this.setState({token})

        this.get_conversations_list();
        this.get_friends_suggestions();

        socket.on('get_conversations_list', data => {
            if(data.conversations) {
                this.setState({conversations: data.conversations})
            } else {
                console.log(data)
            }
        })

        socket.on('get_friends_suggestions', data => {
            if(data.friends_suggestions) {
                this.setState({friends_suggestions: data.friends_suggestions})
            } else {
                console.log(data)
            }
        })

        socket.on('send_friend_request', data => {
            if(data.message === 'success') {
                this.handle_remove_suggestion(data.id);
                this.get_conversations_list();
            } else if(data === 'badId') {
                console.log('Bad friend id')
            } else if(data === 'conflict') {
                console.log('User already your friend or pending')
            } else if(data === 'forbidden') {
                console.log('You must be logged in!')
            } else {
                console.log(data)
            }
        })

        socket.on('confirm_friend_request', data => {
            if(data === 'success') {
                this.get_conversations_list();
                this.get_friends_suggestions();
            } else {
                console.log(data)
            }
        })

        socket.on('get_conversation', data => {
            if(data.message === 'success') {
                this.setState({current_conversation: data.conversation})
                this.send_seen_event(data.conversation._id)
                this.go_to_last_message()
            } else {
                console.log(data)
            }
        })

        socket.on('send_seen_event', data => {
            if(data.message === 'success') {
                var conversations = [...this.state.conversations]
                var conversation = conversations.find(conversation => conversation.conversation._id === data.id);
                if(conversation) {
                    if(conversation.conversation.unseen === this.props.appData.user._id) {
                        conversation.conversation.unseen = null;
                        this.setState({conversations})
                    }
                }
            }
        })

        socket.on('online_status', data => {
            var conversations = this.state.conversations;
            var user = conversations.find( friendship => friendship.friend._id === data.user_id);
            if(user) {
                user.friend.isOnline = data.status;
                if(this.state.current_conversation && this.state.current_conversation.friend._id === data.user_id) {
                    this.setState({conversations, current_conversation: {...this.state.current_conversation, friend: {...this.state.current_conversation.friend, isOnline: data.status}}})
                } else {
                    this.setState({conversations})
                }
            }
        })

        socket.on('new_activity', data => {
            if(data.type === 'message') {
                var conversations = this.state.conversations;
                var conversation = conversations.find(conv => conv.conversation._id === data.conversation);
                conversation.conversation.last_message = data.message;
                if(this.state.current_conversation && this.state.current_conversation._id === data.conversation) {
                    var messages = this.state.current_conversation.messages;
                    messages.push(data.message)
                    this.setState({current_conversation: {...this.state.current_conversation, messages}, conversations: [conversation, ...conversations.filter(conv => conv._id !== conversation._id)], message: ''})
                    this.go_to_last_message();
                } else {
                    conversation.conversation.unseen = data.message.author === this.props.appData.user._id ? conversation.friend._id : this.props.appData.user._id;
                    this.setState({conversations: [conversation, ...conversations.filter(conv => conv._id !== conversation._id)], message: ''})
                }
                
            } 
        })

    }

    componentDidUpdate(props, state) {
        if(state.search_friends_suggestions !== this.state.search_friends_suggestions) {
            this.get_friends_suggestions();
        }
    }

    updateData = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    go_to_last_message = () => {
        var lastMessage = document.getElementById("dummy");
        if(lastMessage) {
            lastMessage.scrollIntoView()
            document.getElementById('input-message').focus();
        }
    }

    send_friend_request = (id) => {
        this.props.appData.socket.emit('send_friend_request', {"friend_id": id})
    }

    confirm_request = (id, answer) => {
        if((answer === false) && this.state.current_conversation && (this.state.current_conversation.friend._id === id)) {
            this.setState({current_conversation: null})
        }
        this.props.appData.socket.emit('confirm_friend_request', {'friend_id': id, 'answer': answer})
    }

    get_conversations_list = () => {
        this.props.appData.socket.emit('get_conversations_list')
    }

    get_friends_suggestions = () => {
        this.props.appData.socket.emit('get_friends_suggestions', this.state.search_friends_suggestions)
    }

    handle_remove_suggestion = (id) => {
        this.setState( prevState => ({
            friends_suggestions: prevState.friends_suggestions.filter(suggestion => suggestion._id !== id)
        }))
    }

    get_conversation = (id) => {
        this.props.appData.socket.emit('get_conversation', id)
    }

    send_seen_event = (id) => {
        this.props.appData.socket.emit('send_seen_event', id)
    }

    send_message = (e) => {
        e.preventDefault()
        if(this.state.message.length < 1 || this.state.message.length > 500) {
            alert('Message must be at least 1 character long and at most 500')
            return;
        } else {
            this.props.appData.socket.emit('add_message', {"message": this.state.message, "conversation_id": this.state.current_conversation._id})
        }
    }

    render() {
        
        return(
            <Row className="h-100 w-100 m-0">
               <Friends conversations={this.state.conversations} 
                    friends_suggestions={this.state.friends_suggestions} 
                    send_request={this.send_friend_request} 
                    confirm_request={this.confirm_request}
                    remove_suggestion={this.handle_remove_suggestion}
                    get_conversation={this.get_conversation}
                    search_suggestions={(search_word) => this.setState({search_friends_suggestions: search_word})}
                />
                <Conversation conversation={this.state.current_conversation}
                    updateData={this.updateData} 
                    send_message={this.send_message}
                    close_conversation={() => this.setState({current_conversation: null})}
                    message={this.state.message}
                />
            </Row>
            
        );
    }
}

export default Messenger;