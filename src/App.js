import React from 'react';
import GameBoard from './components/GameBoard';
import './styles/App.css';

const App = () => (
  <div className="app">
    <center><h1 className='mindmask-title'>MindMask: Mr.AI's Charade Challenge</h1></center>
    <GameBoard />
  </div>
);

export default App;