import React from 'react';
import {Button} from 'reactstrap';
const Suggestion = props => {
    return(
        <li className=" friend clearfix">
            <img src={ props.suggestion.picture || "/img/avatar.png"} alt="user avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}}/>
            <div className="font-weight-bold friend-name">
                {props.suggestion.firstName + " " + props.suggestion.lastName}
            </div>
            <Button className="add-friend-button" color="primary" size="sm" onClick={() => props.send_request(props.suggestion._id)}>Add friend</Button>
        </li>
    );
}

export default Suggestion;