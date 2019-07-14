import React from 'react';
import { Button, FormGroup, Label, Input } from 'reactstrap';
import {Link} from 'react-router-dom';
import FormWrapper from './FormWrapper';

const Login = props => {

  return (
      <FormWrapper {...props}>
        <h1 className="text-center m-3">Login</h1>
          <FormGroup>
            <Label for="email">Email</Label>
            <Input type="email" name="email" id="email" onChange={props.updateData} value={props.email} placeholder="Enter your email" required minLength="4" maxLength="50" />
          </FormGroup>
          <FormGroup>
            <Label for="password">Password</Label>
            <Input type="password" name="password" id="password" onChange={props.updateData} value={props.password} placeholder="Enter your password" required minLength="4" maxLength="50" />
          </FormGroup>
          <FormGroup>
            <Button color="dark" size="lg" block >Submit</Button>
          </FormGroup>
          <p className="text-center"><Link to="/forgot">Forgot password ?</Link> | <Link to="/register">Register</Link></p>
      </FormWrapper>
    );
}

export default Login;
