import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import SketchPad from './SketchPad';
import AiSketch from './AiSketch';
import ScoreCard from './ScoreCard';
import TurnIndicator from './TurnIndicator';
import GameOverModal from './GameOverModal';
import { guessSketch } from '../services/openaiService';

const categories = ['cat', 'dog', 'house', 'tree', 'car', 'bird', 'fish', 'chair', 'apple', 'boat'];

const GameBoard = () => {
  const [turn, setTurn] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [aiScore, setAiScore] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [usedCategories, setUsedCategories] = useState([]);
  const [playerCategory, setPlayerCategory] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const turnInitialized = useRef(false);

  const getRandomCategory = (exclude = []) => {
    const available = categories.filter(cat => 
      !usedCategories.includes(cat) && !exclude.includes(cat)
    );
    return available.length ? available[Math.floor(Math.random() * available.length)] : '';
  };

  const initializeTurn = () => {
    if (!turnInitialized.current && isPlayerTurn && !gameOver && turn <= 5) {
      const newPlayerCategory = getRandomCategory();
      setPlayerCategory(newPlayerCategory);
      setUsedCategories(prev => [...prev, newPlayerCategory]);
      turnInitialized.current = true;
    } else if (turn > 5) {
      setGameOver(true);
    }
  };

  const handlePlayerSketch = async (sketch) => {
    if (gameOver) return;
    
    try {
      const aiGuess = await guessSketch(sketch);
      const newAiCategory = getRandomCategory([playerCategory]);
      setStateAfterGuess(aiGuess, newAiCategory);
    } catch (error) {
      alert("Oops, Mr.AI couldn't guess your sketch!");
      setIsPlayerTurn(false);
    }
  };

  const setStateAfterGuess = (aiGuess, newAiCategory) => {
    if (gameOver) return;
    const isCorrect = aiGuess.toLowerCase() === playerCategory.toLowerCase();

    ReactDOM.unstable_batchedUpdates(() => {
      if (isCorrect) {
        setPlayerScore(prev => prev + 1);
      }
      setAiCategory(newAiCategory);
      setUsedCategories(prev => [...prev, newAiCategory]);
      setIsPlayerTurn(false);
    });

    alert(isCorrect 
      ? `Mr.AI guessed '${aiGuess}' correctly! You get 1 point!` 
      : `Mr.AI guessed '${aiGuess}', but it was wrong.`
    );
  };

  const handlePlayerGuess = (guess) => {
    if (gameOver) return;
    const isCorrect = guess.toLowerCase() === aiCategory.toLowerCase();

    ReactDOM.unstable_batchedUpdates(() => {
      if (isCorrect) {
        setAiScore(prev => prev + 1);
      }
      setTurn(prev => prev + 1);
      setPlayerCategory('');
      setAiCategory('');
      setIsPlayerTurn(true);
      turnInitialized.current = false;
    });

    alert(isCorrect 
      ? `You guessed '${guess}' correctly! Mr.AI gets 1 point!` 
      : `No, it was '${aiCategory}'.`
    );
  };

  const handlePlayAgain = () => {
    setTurn(1);
    setIsPlayerTurn(true);
    setAiScore(0);
    setPlayerScore(0);
    setUsedCategories([]);
    setPlayerCategory('');
    setAiCategory('');
    setGameOver(false);
    turnInitialized.current = false;
  };

  useEffect(() => {
    initializeTurn();
  }, [turn, isPlayerTurn, gameOver]);

  return (
    <div className="game-board">
      <ScoreCard aiScore={aiScore} playerScore={playerScore} />
      <TurnIndicator isPlayerTurn={isPlayerTurn} turn={turn} />
      <div className="possible-options">
        <h3>Possible Options:</h3>
        <p>{categories.join(', ')}</p>
      </div>
      {gameOver ? (
        <GameOverModal 
          aiScore={aiScore} 
          playerScore={playerScore} 
          onPlayAgain={handlePlayAgain} 
        />
      ) : (
        isPlayerTurn ? (
          <SketchPad 
            category={playerCategory} 
            onSubmit={handlePlayerSketch} 
          />
        ) : (
          <AiSketch 
            key={`ai-${aiCategory || 'empty'}-${turn}`} 
            category={aiCategory} 
            onGuess={handlePlayerGuess} 
          />
        )
      )}
    </div>
  );
};

export default GameBoard;