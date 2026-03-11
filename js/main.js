// Game/public/dune/js/main.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;
canvas.style.width = CANVAS_WIDTH + 'px';
canvas.style.height = CANVAS_HEIGHT + 'px';
ctx.scale(dpr, dpr);

// Temporary: draw a test rectangle to confirm canvas works
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
ctx.fillStyle = '#4a8c3f';
ctx.fillRect(100, 100, 32, 32);
ctx.fillStyle = '#fff';
ctx.font = '16px monospace';
ctx.fillText('Alpine Cheese Rush — Canvas OK', 150, 120);
