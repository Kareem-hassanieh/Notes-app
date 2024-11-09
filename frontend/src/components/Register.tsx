import React, { useState } from 'react';
import axios from 'axios';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleRegister(e: React.FormEvent){
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/user/create', {
        username: username,
        email: email,
        password: password
      }
      );

      if (response.data.success) {
        setMessage('User registered successfully! You can now log in.');
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage('An error occurred during registration.');
      console.error('Registration error:', error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default Register;
