import React from 'react';
import {Form, FormGroup, Button, Input, Row, Col, Alert} from 'reactstrap';

const Reset = (props) => {
    return(
        <Row className="m-0">
            <Col xs={{size:4, offset:4}}>
                <Form onSubmit={(e) => props.tryReset(e, props.match.params.token, props.history)}>
                <Alert color={props.alertType} isOpen={props.alertVisible} toggle={props.dismissAlert}>
                    {props.alertMessage}
                </Alert>
                    <h4 className="text-center m-5">Enter your new password</h4>
                    <FormGroup>
                        <Input type="password" name="password" id="password" value={props.password} onChange={props.updateData} required placeholder="New password" minLength="4" maxLength="50" />
                    </FormGroup>
                    <FormGroup>
                        <Input type="password" name="rpassword" id="rpassword" value={props.rpassword} onChange={props.updateData} required placeholder="Retype password" minLength="4" maxLength="50" />
                    </FormGroup>
                    <FormGroup>
                        <Button color="dark" size="lg" block >Submit</Button>
                    </FormGroup>
                </Form>
            </Col>
        </Row>
    )
}

export default Reset;