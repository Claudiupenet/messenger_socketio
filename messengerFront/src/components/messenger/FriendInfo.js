import React from 'react';

const FriendInfo = ({friend}) => {
    return(
        <div className="d-flex flex-column align-items-center">
            <img src={friend.picture || '/img/avatar.png'} alt='User avatar' className="friend-info-avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}} />
            <h3 className="m-3 text-center">{friend.firstName + " " + friend.lastName}</h3>
            {friend.isOnline ? <span className="badge badge-success">Online</span> : <span className="badge badge-danger">Offline</span>}
            {friend.description && <p className="mt-3 font-italic">"{friend.description}"</p>}
            {friend.email && <h6 className="mt-3">Email: {friend.email}</h6>}
            {friend.phone && <h6>Phone number: {friend.phone}</h6>}
        </div>
    );

}

export default FriendInfo;