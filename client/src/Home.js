import React from 'react';
import { Link } from 'react-router-dom';


export default props => {
  // props: is user connected, logged username

  const title = props.connected ?
    <h1>You are connected!</h1> :
    <h1>Welcome to breadracer's Japanese Mahjong!</h1>;
  const userWelcome = props.loggedUser ?
    <h3>Hi, {props.loggedUser}!</h3> :
    <h3>Please log in or sign up first.</h3>;
  return (
    <div style={{
      display: 'flex',
      flexFlow: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      margin: '10% 20%'
    }}>
      <div>
        {title}
        {userWelcome}
      </div>
      <div>
        <Link to='/login'><button>Log in</button></Link>
        <Link to='/register'><button>Sign up</button></Link>
      </div>
    </div>
  );
}