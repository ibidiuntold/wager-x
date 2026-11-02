const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 400x400 canvas
const canvas = createCanvas(400, 400);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(0, 0, 400, 400);

// Draw grid
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 4;

// Vertical lines
ctx.beginPath();
ctx.moveTo(133, 50);
ctx.lineTo(133, 350);
ctx.moveTo(267, 50);
ctx.lineTo(267, 350);
ctx.stroke();

// Horizontal lines
ctx.beginPath();
ctx.moveTo(50, 133);
ctx.lineTo(350, 133);
ctx.moveTo(50, 267);
ctx.lineTo(350, 267);
ctx.stroke();

// Draw X
ctx.beginPath();
ctx.moveTo(70, 70);
ctx.lineTo(120, 120);
ctx.moveTo(120, 70);
ctx.lineTo(70, 120);
ctx.stroke();

// Draw O
ctx.beginPath();
ctx.arc(200, 200, 30, 0, Math.PI * 2);
ctx.stroke();

// Draw X
ctx.beginPath();
ctx.moveTo(280, 280);
ctx.lineTo(330, 330);
ctx.moveTo(330, 280);
ctx.lineTo(280, 330);
ctx.stroke();

// Save the image
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'public', 'game-assets', 'tictactoe', 'preview.png');
fs.writeFileSync(outputPath, buffer);

console.log('TicTacToe preview image generated successfully!');
