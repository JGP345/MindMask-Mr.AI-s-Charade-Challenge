// src/services/openaiService.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || 'placeholder-key',
  dangerouslyAllowBrowser: true,
});

const categories = ['cat', 'dog', 'house', 'tree', 'car', 'bird', 'fish', 'chair', 'apple', 'boat'];

export const guessSketch = async (imageBase64) => {
  if (!process.env.REACT_APP_OPENAI_API_KEY) {
    console.log('No API key, using mock response');
    return categories[Math.floor(Math.random() * categories.length)];
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `What is this drawing of? Choose only from these options: ${categories.join(', ')}. Avoid anything inappropriate or unrelated to these categories. Answer with a single word or short phrase.`,
            },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
    });
    const guess = response.choices[0].message.content.toLowerCase();
    return categories.includes(guess) ? guess : categories[Math.floor(Math.random() * categories.length)];
  } catch (error) {
    console.error('Error guessing sketch:', error);
    throw new Error('Failed to guess sketch');
  }
};

export const generateSketchInstructions = async (category) => {
  if (!process.env.REACT_APP_OPENAI_API_KEY) {
    const mockInstructions = {
      cat: ['Draw a circle at (200, 150) with radius 50', 'Draw a triangle from (170, 100) to (200, 70) to (230, 100)', 'Draw a small circle at (180, 140) with radius 10', 'Draw a small circle at (210, 140) with radius 10'],
      dog: ['Draw an oval at (200, 150) with width 60 and height 40', 'Draw a line from (140, 140) to (140, 180)', 'Draw a line from (260, 140) to (260, 180)'],
      house: ['Draw a rectangle at (150, 150) with width 100 and height 100', 'Draw a triangle from (150, 150) to (200, 100) to (250, 150)'],
      tree: ['Draw a triangle from (200, 100) to (150, 200) to (250, 200)', 'Draw a rectangle at (190, 200) with width 20 and height 50'],
      car: ['Draw a rectangle at (150, 150) with width 100 and height 50', 'Draw a circle at (170, 200) with radius 20', 'Draw a circle at (230, 200) with radius 20'],
      bird: ['Draw an oval at (200, 150) with width 50 and height 30', 'Draw a triangle from (230, 140) to (250, 130) to (250, 150)'],
      fish: ['Draw an oval at (200, 150) with width 50 and height 30', 'Draw a triangle from (250, 150) to (280, 130) to (280, 170)'],
      chair: ['Draw a rectangle at (170, 150) with width 60 and height 20', 'Draw a line from (170, 150) to (170, 100)', 'Draw a line from (230, 150) to (230, 100)', 'Draw a line from (170, 170) to (170, 200)', 'Draw a line from (230, 170) to (230, 200)'],
      apple: ['Draw a circle at (200, 150) with radius 40', 'Draw a line from (200, 110) to (200, 130)'],
      boat: ['Draw a rectangle at (150, 200) with width 100 and height 50', 'Draw a triangle from (200, 150) to (200, 100) to (220, 150)'],
    };
    return mockInstructions[category] || ['Draw a circle at (200, 150) with radius 30'];
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'o1-mini',
      messages: [
        {
          role: 'user',
          content: `Provide a list of simple drawing instructions for a ${category} on a 400x300 canvas. Use only these shapes: circle, oval, triangle, rectangle, line. Specify coordinates as (x, y). Use "width" and "height" for ovals and rectangles, "radius" for circles, and "vertices at (x1, y1), (x2, y2), (x3, y3)" for triangles. Format each line as "Draw a [shape] at (x, y) with [parameters]". Limit to 5-10 steps. Return only the instructions, one per line. No extra text.`,
        },
      ],
    });
    const raw = response.choices[0].message.content;
    console.log('OpenAI raw response:', raw);
    return raw.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Error generating instructions:', error);
    return [`Draw a simple ${category} at (200, 150)`];
  }
};