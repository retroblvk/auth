import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.css';
import Main from './pages/main';
import Registration from './pages/registration';

function App() {
  return (
    <Router>
      <Route path='/registration' exact render={(props) => <Registration />} />
      <Route path='/' exact render={(props) => <Main />} />
    </Router>
  );
}

export default App;
