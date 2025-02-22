// src/components/SketchPad.js
import React, { useEffect, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { motion } from 'framer-motion';

const SketchPad = ({ category, onSubmit }) => {
  const canvasRef = useRef(null);

  const resetCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.resetCanvas();
    }
  };

  const handleSubmit = () => {
    if (!canvasRef.current) return;

    canvasRef.current.exportImage('png')
      .then(image => onSubmit(image))
      .catch(() => {}); // Silently handle export errors
  };

  useEffect(() => {
    resetCanvas();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
    >
      <div className="sketch-pad">
        <h2>Please draw a '{category}' and upload your sketch.</h2>
        <div className="canvas-container">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            strokeColor="#000000"
            width="400px"
            height="300px"
            className="sketch-canvas"
          />
        </div>
        <button onClick={handleSubmit} className="submit-btn">
          Submit Sketch
        </button>
      </div>
    </motion.div>
  );
};

export default SketchPad;