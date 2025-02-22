// src/components/AiSketch.js
import React, { useState, useRef, useEffect } from 'react';
import { generateSketchInstructions } from '../services/openaiService';

const AiSketch = ({ category, onGuess }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [playerGuess, setPlayerGuess] = useState('');
  const canvasRef = useRef(null);
  const hasDrawnRef = useRef(false);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
  };

  const instructionsPromise = React.useMemo(() => {
    if (!category) return Promise.resolve([]);
    return generateSketchInstructions(category);
  }, [category]);

  const parseInstructions = (rawInstructions) => {
    return rawInstructions
      .filter(line => line.trim() && line.toLowerCase().includes('draw'))
      .map(line => line.replace(/^\s*\d*\.\s*-\s*|\s*\.\s*$/g, '').trim());
  };

  const calculateBoundsAndOffset = (instructions, canvas) => {
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    
    instructions.forEach(step => {
      const coords = step.match(/\((\d+),\s*(\d+)\)/g);
      if (coords) {
        coords.forEach(coord => {
          const [, x, y] = coord.match(/\((\d+),\s*(\d+)\)/);
          const px = parseInt(x);
          const py = parseInt(y);
          bounds.minX = Math.min(bounds.minX, px);
          bounds.maxX = Math.max(bounds.maxX, px);
          bounds.minY = Math.min(bounds.minY, py);
          bounds.maxY = Math.max(bounds.maxY, py);
        });
      }
    });

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const drawingWidth = bounds.maxX - bounds.minX;
    const drawingHeight = bounds.maxY - bounds.minY;
    return {
      offsetX: centerX - (bounds.minX + drawingWidth / 2),
      offsetY: centerY - (bounds.minY + drawingHeight / 2)
    };
  };

  const animateCursor = (targetX, targetY, callback) => {
    const duration = 500;
    const startTime = performance.now();
    const startPos = { ...cursorPos };

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);

      setCursorPos({
        x: startPos.x + (targetX - startPos.x) * ease,
        y: startPos.y + (targetY - startPos.y) * ease,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };
    requestAnimationFrame(animate);
  };

  const drawShape = (ctx, shapeData, offsetX, offsetY) => {
    const { shape, x1, y1, width, height, radius, x2, y2, tx1, ty1, tx2, ty2, tx3, ty3 } = shapeData;
    const adjustedX1 = (x1 || 0) + offsetX;
    const adjustedY1 = (y1 || 0) + offsetY;
    ctx.beginPath();

    switch (shape.toLowerCase()) {
      case 'rectangle':
        animateCursor(adjustedX1, adjustedY1, () => {
          ctx.rect(adjustedX1, adjustedY1, width || 10, height || 10);
          ctx.stroke();
        });
        break;
      case 'circle':
      case 'circles':
        animateCursor(adjustedX1, adjustedY1, () => {
          ctx.arc(adjustedX1, adjustedY1, radius || 5, 0, Math.PI * 2);
          ctx.stroke();
        });
        break;
      case 'oval':
      case 'ovals':
        const rx = width ? width / 2 : 10;
        const ry = height ? height / 2 : 20;
        animateCursor(adjustedX1, adjustedY1, () => {
          ctx.ellipse(adjustedX1, adjustedY1, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        break;
      case 'triangle':
        if (tx1 && ty1 && tx2 && ty2 && tx3 && ty3) {
          animateCursor(tx1 + offsetX, ty1 + offsetY, () => {
            ctx.moveTo(tx1 + offsetX, ty1 + offsetY);
            animateCursor(tx2 + offsetX, ty2 + offsetY, () => {
              ctx.lineTo(tx2 + offsetX, ty2 + offsetY);
              animateCursor(tx3 + offsetX, ty3 + offsetY, () => {
                ctx.lineTo(tx3 + offsetX, ty3 + offsetY);
                ctx.closePath();
                ctx.stroke();
              });
            });
          });
        }
        break;
      case 'line':
      case 'lines':
        if (x2 && y2) {
          animateCursor(adjustedX1, adjustedY1, () => {
            ctx.moveTo(adjustedX1, adjustedY1);
            animateCursor(x2 + offsetX, y2 + offsetY, () => {
              ctx.lineTo(x2 + offsetX, y2 + offsetY);
              ctx.stroke();
            });
          });
        } else if (height && !x2 && !y2) {
          animateCursor(adjustedX1, adjustedY1, () => {
            ctx.moveTo(adjustedX1, adjustedY1);
            animateCursor(adjustedX1, adjustedY1 + height, () => {
              ctx.lineTo(adjustedX1, adjustedY1 + height);
              ctx.stroke();
            });
          });
        }
        break;
    }
  };

  const drawWithCursor = async () => {
    if (hasDrawnRef.current) return;
    hasDrawnRef.current = true;
    setIsLoading(true);

    try {
      const rawInstructions = await instructionsPromise;
      const instructions = parseInstructions(rawInstructions);
      
      if (instructions.length === 0) {
        setIsLoading(false);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;

      const { offsetX, offsetY } = calculateBoundsAndOffset(instructions, canvas);

      let stepIndex = 0;
      const drawStep = () => {
        if (stepIndex >= instructions.length) {
          setCursorPos({ x: 0, y: 0 });
          setIsLoading(false);
          return;
        }

        const step = instructions[stepIndex];
        let multiMatch = step.match(/Draw\s*(?:a|an|two)?\s*(?:small|large|upside-down|half|brown|green)?\s*(\w+)\s*(?:at|from)?\s*\((\d+),\s*(\d+)\)?(?:\s*with\s*(?:width\s*(\d+)\s*and\s*height\s*(\d+)|radius\s*(\d+)|width\s*(\d+)|height\s*(\d+)))?(?:\s*(?:to|end at)\s*\((\d+),\s*(\d+)\))?/i);

        if (!multiMatch && step.includes('triangle')) {
          multiMatch = step.match(/Draw\s*(?:a|an|two)?\s*(?:small|large|upside-down|half|brown|green)?\s*triangle\s*with\s*vertices\s*at\s*\((\d+),\s*(\d+)\),\s*\((\d+),\s*(\d+)\),\s*\((\d+),\s*(\d+)\)/i);
        }

        if (multiMatch) {
          const shapeData = multiMatch.length === 7 
            ? { shape: 'triangle', tx1: parseInt(multiMatch[1]), ty1: parseInt(multiMatch[2]), tx2: parseInt(multiMatch[3]), ty2: parseInt(multiMatch[4]), tx3: parseInt(multiMatch[5]), ty3: parseInt(multiMatch[6]) }
            : { shape: multiMatch[1], x1: parseInt(multiMatch[2]), y1: parseInt(multiMatch[3]), width: parseInt(multiMatch[4]), height: parseInt(multiMatch[5]), radius: parseInt(multiMatch[6]), x2: parseInt(multiMatch[9]), y2: parseInt(multiMatch[10]) };

          drawShape(ctx, shapeData, offsetX, offsetY);
          stepIndex++;
          setTimeout(drawStep, 200);
        } else {
          stepIndex++;
          setTimeout(drawStep, 200);
        }
      };

      drawStep();
    } catch (error) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeCanvas();
  }, []);

  useEffect(() => {
    if (hasDrawnRef.current || !category) return;
    drawWithCursor();
  }, [category]);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    onGuess(playerGuess);
    setPlayerGuess('');
  };

  return (
    <div className="ai-sketch">
      <h2>Mr. AI is Drawing...</h2>
      <div className="canvas-container">
        <canvas ref={canvasRef} width={400} height={300} className="ai-canvas" />
        {cursorPos.x !== 0 && cursorPos.y !== 0 && (
          <div className="cursor" style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }} />
        )}
      </div>
      {isLoading ? (
        <div className="loading">
          <p>AI is sketching...</p>
          <div className="spinner"></div>
        </div>
      ) : (
        <form onSubmit={handleGuessSubmit}>
          <input
            type="text"
            value={playerGuess}
            onChange={(e) => setPlayerGuess(e.target.value)}
            placeholder="What did I draw?"
            required
          />
          <button type="submit">Guess</button>
        </form>
      )}
    </div>
  );
};

export default AiSketch;