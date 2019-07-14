import React from 'react';
import {Form, FormGroup, Button, Input, Row, Col, Alert} from 'reactstrap';

const Forgot = (props) => {    

    return(
        <Row className="m-0">
            <Col xs={{size:4, offset:4}}>
                <Form onSubmit={props.submitReset} id="submit_reset">
                    <Alert color={props.alertType} isOpen={props.alertVisible} toggle={props.dismissAlert}>
                        {props.alertMessage}
                    </Alert>
                    <h3 className="text-center m-5">Forgot Password</h3>
                    <FormGroup>
                        <Input type="email" name="email" id="email" onChange={props.updateData} 
                            required placeholder="Enter your email" minLength="4" maxLength="50" value={props.email} />
                    </FormGroup>
                    <FormGroup>
                        <Button type='submit' color="dark" size="lg" block >Submit</Button>
                    </FormGroup>
                </Form>
            </Col>
        </Row>
    )
}

export default Forgot;