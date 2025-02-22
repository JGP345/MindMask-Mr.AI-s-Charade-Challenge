import React from 'react';

const ScoreCard = ({ aiScore, playerScore }) => (
  <div className="score-card">
    <div className="score">Mr.AI: {aiScore}</div>
    <div className="score">Player: {playerScore}</div>
  </div>
);

export default ScoreCard;