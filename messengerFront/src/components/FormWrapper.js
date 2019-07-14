import React from 'react';
import { Form, Row, Col, Alert } from 'reactstrap';

const formWrapper = props => {
    return (
      <Row style={{margin: "auto"}}>
        <Col xs={{size: 6, offset: 3}}>
          <Form onSubmit={ window.location.pathname === '/login' ? (e) => props.tryLogin(e) : (e) => props.tryRegister(e)}>
          <Alert color={props.alertType} isOpen={props.alertVisible} toggle={props.dismissAlert}>
            {props.alertMessage}
          </Alert>
          {props.children}
          </Form>
        </Col>
      </Row>
    );
}

export default formWrapper;