import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login'; // Import your Login component

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Directly set the root path to the Login component */}
        <Route path="/" element={<Login />} />  {/* Login as the root page */}

        {/* Define routes for Register */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;

