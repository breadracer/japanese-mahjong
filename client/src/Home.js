import React from 'react';
import { Link } from 'react-router-dom';


export default props => {
  // props: is user connected, logged username

  const title = props.connected ?
    <h1>You are connected!</h1> :
    <h1>Please try connect first!</h1>;
  const userWelcome = props.loggedUser ?
    <h3>Hi, {props.loggedUser}!</h3> :
    <h3>You are not logged in</h3>;
  return (
    <div>
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