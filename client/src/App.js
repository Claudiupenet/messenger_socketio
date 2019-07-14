import React from 'react';
import './App.css';
import { Spinner, Row, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";
import Login from './components/Login';
import Register from './components/Register';
import Forgot from './components/Forgot';
import Reset from './components/Reset';
import Messenger from './components/Messenger';
import Profile from './components/Profile';
import socketIO from 'socket.io-client';

class App extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      rpassword: '',
      alertVisible: false,
      alertMessage: '',
      alertType: '',
      loading: true,
      profile_modal: false,
      redirect: null
    }
  }

   componentDidMount() {

    const socket = socketIO('/');
    if(socket) {
      this.setState({socket})
    }

    const token = localStorage.getItem("token");
    if(token) {
      socket.emit('login_using_token', {token})
    } else {
      this.setState({loading: false})
    }

    socket.on('login_using_token', data => {
      if(data.user) {
        this.setState({user: data.user, isAuth: true, loading: false})
      } else if(data === 'badtoken') {
        localStorage.removeItem('token')
        this.setState({alertVisible: true, alertMessage: "Token error. Please login again!", alertType: "danger", loading: false})
      }
    })

    socket.on('register', data => {
      if(data === 'ok') {
        this.setState({alertVisible: true, alertMessage: "Registered with success. Please login.", alertType: "success", redirect: '/login'})
      }  else if(data === 'conflict') {
        console.log("conflict")
        this.setState({alertVisible: true, alertMessage: "Email already in use", alertType: "danger"})
      } else {
        console.log(data)
      }

    })

    socket.on('login', res => {
      if(res.token) {
        localStorage.setItem('token', res.token)
        this.setState({user: res.user, isAuth: true})
      } else if(res === 'notfound') {
        this.setState({alertVisible: true, alertMessage: "Wrong email address", alertType: "danger"})
      } else if(res === 'wrongpassword') {
        this.setState({alertVisible: true, alertMessage: "Wrong password", alertType: "danger"})
      } else {
        console.log(res)
      }
    })

    socket.on('forgot_password', data => {
      if(data === 'notfound') {
        this.setState({alertVisible: true, alertMessage: "User not found. Wrong email address!", alertType: "danger"})
      } else if(data === 'success') {

        document.getElementById('submit_reset').innerHTML = '<h3 class="m-5">Please check your email for reset link.</h3>'
      } else {
        console.log(data)
      }
    })

    socket.on('reset_password', data => {
      if(data === 'success') {
        this.setState({alertVisible: true, alertMessage: "Password was reset. Please login.", alertType: "success", redirect: '/login'})
      } else if(data === 'badToken') {
        this.setState({alertVisible: true, alertMessage: "Bad token. Try again from the begining.", alertType: "danger"})
      } else {
        console.log(data)
      }
    })

    socket.on('update_profile', data => {
      if(data.message === 'success') {
        this.setState({user: data.user})
        this.toggle_profile_modal()
      } else {
        console.log(data)
      }
    })

  }
  componentDidUpdate(props, state) {
    
    if(state.redirect !== null) {
      this.setState({redirect: null})
    }
  }

  componentWillUnmount() {
    this.state.socket.abort()
  }

  updateData = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }
  updateUserData = (e) => {
    this.setState({
      user: {...this.state.user,
        [e.target.name]: e.target.value
      }
    })
  }

  dismissAlert = () => {
    this.setState({alertVisible: false, alertMessage: '', alertType: ''})
  }

  toggle_profile_modal = () => {
    this.setState(prevState => ({
        profile_modal: !prevState.profile_modal
    }));
}

  tryLogin = (e) => {
    e.preventDefault();
    if(this.state.email && this.state.password) {
      this.state.socket.emit('login', {email: this.state.email, password: this.state.password})
    } else {
      this.setState({alertVisible: true, alertMessage: "Please provide email and password!", alertType: "danger"})
    }
  }

  tryRegister = (e) => {
    e.preventDefault();
    if(this.state.email && this.state.password && this.state.firstName && this.state.lastName) {
      if(!(this.state.password === this.state.rpassword)) {
        this.setState({alertVisible: true, alertMessage: "Passwords don't match!", alertType: "danger"})
      } else {
        this.state.socket.emit('register', {firstName: this.state.firstName, lastName: this.state.lastName, password: this.state.password, email: this.state.email})
      }
    } else {
      this.setState({alertVisible: true, alertMessage: "Please provide all the information", alertType: "danger"})
    }
  }

  tryReset = (e,token) => {
    e.preventDefault();
    if(this.state.password !== this.state.rpassword) {
      this.setState({alertVisible: true, alertMessage: "Passwords don't match!", alertType: "danger"})
    } else {
      this.state.socket.emit('reset_password', {password: this.state.password, token})
    }
  }

   submitReset = (e) => {
    e.preventDefault()
    this.state.socket.emit('forgot_password', this.state.email)
  }

  updateProfile = (e, password) => {
    e.preventDefault()
    this.state.socket.emit('update_profile', {...this.state.user, password})
}

  logout = () => {
    localStorage.removeItem('token');
    this.setState({isAuth: false, user: null})
  }
  
  render() {
    if (this.state.loading) {
      return (
        <Row className="d-flex align-items-center h-100 justify-content-center" style={{margin: "auto"}}>
             <Spinner color="primary" />
        </Row>
      )}
      
      return (
        <Router>
        {this.state.redirect && <Redirect to={this.state.redirect} />} 
        {this.state.isAuth && <Redirect to="/" />}
        {this.state.profile_modal && <Profile user={this.state.user} toggle={this.toggle_profile_modal} 
                                        updateProfile={this.updateProfile} updateData={this.updateUserData} />}
        {this.state.isAuth && <div className="user-menu">
              <UncontrolledDropdown>
                  <DropdownToggle className="p-0 btn-light" caret>
                  <img className="user-avatar" src={this.state.user.picture || '/img/avatar.png'} alt="User avatar" onError={(e)=>{e.target.onerror = null; e.target.src="/img/avatar.png"}}/> {this.state.user.firstName}
                  </DropdownToggle>
                  <DropdownMenu right>
                      <DropdownItem header>User Menu</DropdownItem>
                      <DropdownItem onClick={this.toggle_profile_modal}>Profile</DropdownItem>
                      <DropdownItem divider />
                      <DropdownItem onClick={this.logout}><img src="/img/logout.png" width="35" height="35" alt="Logout icon"/>  Log Out</DropdownItem>
                  </DropdownMenu>
              </UncontrolledDropdown>
          </div>}

        <Switch>
          <Route path="/login" render={() => 
            <Login
            updateData={this.updateData} tryLogin={this.tryLogin} 
            dismissAlert={this.dismissAlert} alertMessage={this.state.alertMessage} 
            alertType={this.state.alertType} alertVisible={this.state.alertVisible} 
            />
          }
          />
          <Route path="/register" render={() => 
            <Register
            updateData={this.updateData} tryRegister={this.tryRegister} 
            dismissAlert={this.dismissAlert} alertMessage={this.state.alertMessage} 
            alertType={this.state.alertType} alertVisible={this.state.alertVisible} 
            />} 
          />
          <Route path="/forgot" render={() =>
            <Forgot dismissAlert={this.dismissAlert} alertMessage={this.state.alertMessage} 
              alertType={this.state.alertType} alertVisible={this.state.alertVisible} 
              updateData={this.updateData} email={this.state.email} submitReset={this.submitReset} />} />
          <Route path="/reset/:token" render={(props) => 
          <Reset tryReset={(e,token, history) => this.tryReset(e,token, history)} 
            password={this.state.password} rpassword={this.state.rpassword} 
            updateData={this.updateData} {...props} 
            dismissAlert={this.dismissAlert} alertMessage={this.state.alertMessage} 
            alertType={this.state.alertType} alertVisible={this.state.alertVisible}/>} />
          <Route path="/" render={() => this.state.isAuth ? <Messenger appData={this.state} logout={this.logout} updateData={this.updateData} /> : <Redirect to="/login" />} />
        </Switch>
      </Router>
    );
  }
}

export default App;
