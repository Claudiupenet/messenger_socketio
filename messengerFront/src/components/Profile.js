import React, {useEffect} from 'react';
import { Col, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';


const Profile = ({user, updateData, updateProfile, toggle}) => {

    var passwordsDontMatch = React.createRef();
    var [password, updatePassword] = React.useState('');
    var[rpassword, updateRpassword] = React.useState('');
    useEffect(() => {
        passwordsDontMatch.current.innerHTML = '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[password, rpassword])

    const verify_passwords = (e) => {
        e.preventDefault()
        if(password !== rpassword) {
            passwordsDontMatch.current.innerHTML = "Passwords must match!";
            document.getElementById('password').focus();
        } else { 
            updateProfile(e, password)
        }
    }

    return(
        <Modal isOpen={true} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>
                <img src={user.picture || '/img/avatar.png'} alt='User avatar' className="rounded-circle mr-3 mb-2" width="50" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}} />
                Edit profile</ModalHeader>
            <ModalBody>
                <Form onSubmit={(e) => verify_passwords(e) }>
                    <FormGroup row>
                        <Label for="email" sm={2}>Email</Label>
                        <Col sm={10}>
                            <Input type="email" name="email" id="email" placeholder="email address" value={user.email} disabled />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Label for="firstName" sm={2}>First Name</Label>
                        <Col sm={4}>
                            <Input type="text" onChange={updateData} name="firstName" id="firstName" placeholder="First Name" required value={user.firstName} minLength="2" maxLength="30"/>
                        </Col>
                        <Label for="lastName" sm={2}>Last Name</Label>
                        <Col sm={4}>
                            <Input type="text" onChange={updateData} name="lastName" id="lastName" placeholder="Last Name" required value={user.lastName} minLength="2" maxLength="30" />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Label for="picture" sm={2}>Avatar link</Label>
                        <Col sm={4}>
                            <Input type="text" onChange={updateData} name="picture" id="picture" placeholder="Profile picture link" value={user.picture} />
                        </Col>
                        <Label for="phone" sm={2}>Phone</Label>
                        <Col sm={4}>
                            <Input type="number" onChange={updateData} name="phone" id="phone" placeholder="Phone number" value={user.phone} minLength="7" maxLength="13" />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Label for="age" sm={2}>Age</Label>
                        <Col sm={4}>
                            <Input type="number" onChange={updateData} name="age" id="age" placeholder="Age" value={user.age} min="16" max="120" />
                        </Col>
                        <Label for="sex" sm={2}>Sex</Label>
                        <Col sm={4}>
                            <Input type="text" onChange={updateData} name="sex" id="sex" placeholder="Sex" value={user.sex} pattern="Male|Female" title="Valid inputs: Male, Female or leave it empty" />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Label for="description" sm={2}>Description</Label>
                        <Col sm={10}>
                            <Input type="textarea" onChange={updateData} name="description" id="description" placeholder="A short description..." value={user.description} rows={3} />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Col sm={{size: 10, offset: 2}}>
                            <small className="text-danger" ref={passwordsDontMatch}></small>
                        </Col>
                        <Label for="password" sm={2}>Password</Label>
                        <Col sm={5}>
                            <Input type="password" value={password} onChange={(e) => updatePassword(e.target.value) } name="password" id="password" placeholder="Password" />
                        </Col>
                        <Col sm={5}>
                            <Input type="password" value={rpassword} onChange={(e) => updateRpassword(e.target.value)}  name="rpassword" id="rpassword" placeholder="Repeat password" />
                        </Col>
                    </FormGroup>
                    <ModalFooter>
                    <Button type="submit" color="primary">Submit changes</Button>{' '}
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                    </ModalFooter>
                </Form>
            </ModalBody>
        </Modal>
    );
    
}

export default Profile;