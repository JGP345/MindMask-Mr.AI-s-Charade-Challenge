import React from 'react';

const TurnIndicator = ({ isPlayerTurn, turn }) => (
  <div className="turn-indicator">
    <h3>Turn {turn}/5</h3>
    <p>{isPlayerTurn ? "Your Turn" : "AI's Turn"}</p>
  </div>
);

export default TurnIndicator;