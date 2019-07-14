import React from 'react';
import { Button, FormGroup, Label, Input} from 'reactstrap';
import {Link} from 'react-router-dom';
import FormWrapper from './FormWrapper';

const Register = (props) => {
    return (
      <FormWrapper {...props}>
        <h1 className="text-center m-3">Register</h1>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input type="email" name="email" id="email" onChange={props.updateData} value={props.email} placeholder="Enter your email" maxLength="255" required/>
            </FormGroup>
            <FormGroup>
              <Label for="firstName">First Name</Label>
              <Input type="text" name="firstName" id="firstName" onChange={props.updateData} value={props.firstName} placeholder="First name" required minLength="3" maxLength="30"/>
            </FormGroup>
            <FormGroup>
              <Label for="lastName">Last Name</Label>
              <Input type="text" name="lastName" id="lastName" onChange={props.updateData} value={props.lastName} placeholder="Last name" required minLength="3" maxLength="30"/>
            </FormGroup>
            <FormGroup>
              <Label for="password">Password</Label>
              <Input type="password" name="password" id="password" onChange={props.updateData} value={props.password} placeholder="Enter your password" required minLength="4" maxLength="50" />
            </FormGroup>
            <FormGroup>
              <Label for="rpassword">Password confirm</Label>
              <Input type="password" name="rpassword" id="rpassword" onChange={props.updateData} value={props.rpassword} placeholder="Retype your password" required minLength="4" maxLength="50"/>
            </FormGroup>
            <FormGroup>
              <Button color="dark" size="lg" block>Submit</Button>
            </FormGroup>
            <p className="text-center">Already a member? <Link to="/login">Login here</Link></p>
      </FormWrapper>
    );
}

export default Register;
