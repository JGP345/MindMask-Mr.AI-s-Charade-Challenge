import React from 'react';

const GameOverModal = ({ aiScore, playerScore, onPlayAgain }) => {
  const winner = aiScore > playerScore ? 'AI' : playerScore > aiScore ? 'Player' : 'It’s a tie';

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Game Over!</h2>
        <p>AI: {aiScore}, Player: {playerScore}</p>
        <p>{winner} wins!</p>
        <button onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
};

export default GameOverModal;
