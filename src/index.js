import './styles/main.scss';

const canvas = document.querySelector('#canvas');
const drawField = canvas.getContext('2d');
const fieldSize = 512;
const pixelOptionsList = document.querySelector('.canvas_sizes');
const toolsList = document.querySelector('.tools');
const colorPicker = document.querySelector('#color-input');
const colorPickerIcon = document.querySelector('.current_color-icon');
const prevColorLabel = document.querySelector('.prev_color');
const prevIcon = document.querySelector('.prev_color-icon');
const blueLabel = document.querySelector('.blue_color');
const redLabel = document.querySelector('.red_color');
const blue = 'rgb(0, 128, 255)';
const red = 'rgb(254, 1, 96)';
const position = { x: 0, y: 0 };
const hotKeys = {
  KeyB: 'fill',
  KeyP: 'pencil',
  KeyC: 'color',
  KeyR: 'clear',
};

let currentColor = colorPicker.value;
let prevColor = '#fff';
let pixels = 4;
let scale = fieldSize / pixels;
let selectedTool = 'pencil';
let isDrawing = false;
let oldX = null;
let oldY = null;

function setSelectedTool(tool) {
  if (!tool) return;
  const prevActiveTool = document.querySelector('.active');
  prevActiveTool.classList.remove('active');
  const currentActiveTool = document.querySelector(`[data-tool=${tool}]`);
  currentActiveTool.classList.add('active');
  localStorage.setItem('selectedTool', tool);
}

function setIconColor(icon, color) {
  const currentElement = icon;
  currentElement.style.backgroundColor = `${color}`;
}

function setColor(e) {
  prevColor = currentColor;
  currentColor = e.target.value;
  prevColorLabel.classList.remove('disabled');
  setIconColor(colorPickerIcon, currentColor);
  setIconColor(prevIcon, prevColor);
  localStorage.setItem('currentColor', currentColor);
  localStorage.setItem('prevColor', prevColor);
}

function setColorToRed() {
  prevColor = currentColor;
  currentColor = red;
  prevColorLabel.classList.remove('disabled');
  setIconColor(colorPickerIcon, currentColor);
  setIconColor(prevIcon, prevColor);
  localStorage.setItem('currentColor', currentColor);
  localStorage.setItem('prevColor', prevColor);
}

function setColorToBlue() {
  prevColor = currentColor;
  currentColor = blue;
  prevColorLabel.classList.remove('disabled');
  prevIcon.classList.add('disabled');
  setIconColor(colorPickerIcon, currentColor);
  setIconColor(prevIcon, prevColor);
  localStorage.setItem('currentColor', currentColor);
  localStorage.setItem('prevColor', prevColor);
}

function setPrevColor() {
  if (!prevColor) {
    return;
  }
  currentColor = prevColor;
  prevColor = 'rgb(216, 216, 216)';
  prevColorLabel.classList.add('disabled');
  setIconColor(colorPickerIcon, currentColor);
  setIconColor(prevIcon, prevColor);
  localStorage.setItem('currentColor', currentColor);
  localStorage.setItem('prevColor', prevColor);
}

function handleMouseDown(e) {
  position.x = e.pageX - this.offsetLeft;
  position.y = e.pageY - this.offsetTop;
  isDrawing = true;
  drawField.moveTo(position.x, position.y);
}

const calcPos = (pos) => Math.floor(pos / scale) * scale;

function saveImage() {
  const imageToSave = canvas.toDataURL();
  localStorage.setItem('saved data', imageToSave);
}

function restoreImage() {
  const savedImage = localStorage.getItem('saved data');
  const img = new Image();
  img.onload = () => {
    drawField.drawImage(img, 0, 0, 512, 512);
  };
  img.src = savedImage;
  img.setAttribute('crossOrigin', '');
}

function getLinePath(pos0, pos1) {
  let { x, y } = pos0;
  const dx = Math.abs(x - pos1.x);
  const dy = Math.abs(y - pos1.y);
  const sx = (x < pos1.x) ? 1 : -1;
  const sy = (y < pos1.y) ? 1 : -1;
  let error = dx - dy;
  const coord = [];

  while (true) {
    coord.push({ x, y });

    if ((x === pos1.x) && (y === pos1.y)) {
      break;
    }

    const e2 = error * 2;
    if (e2 > -dy) {
      error -= dy;
      x += sx;
    }
    if (e2 < dx) {
      error += dx;
      y += sy;
    }
  }

  return coord;
}

function handleMouseMove(e) {
  if (!isDrawing) {
    oldX = null;
    oldY = null;
    return;
  }

  position.x = e.pageX - this.offsetLeft;
  position.y = e.pageY - this.offsetTop;

  if (oldX !== null) {
    getLinePath(position, { x: oldX, y: oldY }).forEach(({ x, y }) => {
      drawField.beginPath();
      drawField.fillStyle = currentColor;
      drawField.fillRect(calcPos(x), calcPos(y), scale, scale);
    });
  }

  oldX = position.x;
  oldY = position.y;
  saveImage();
}

function handleMouseUp(e) {
  position.x = e.pageX - this.offsetLeft;
  position.y = e.pageY - this.offsetTop;
  drawField.fillStyle = currentColor;
  drawField.fillRect(calcPos(position.x), calcPos(position.y), scale, scale);
  isDrawing = false;
}

function fillCanvas() {
  drawField.fillStyle = currentColor;
  drawField.fillRect(0, 0, pixels * scale, pixels * scale);
}

function clearCanvas() {
  drawField.fillStyle = '#fff';
  drawField.fillRect(0, 0, pixels * scale, pixels * scale);
}

function getPixelColor(e) {
  position.x = e.pageX - this.offsetLeft;
  position.y = e.pageY - this.offsetTop;
  const imgData = drawField.getImageData(position.x, position.y, 1, 1).data;
  const r = imgData[0];
  const g = imgData[1];
  const b = imgData[2];
  const rgb = `rgb(${r}, ${g}, ${b})`;
  prevColor = currentColor;
  currentColor = rgb;
  setIconColor(colorPickerIcon, currentColor);
  setIconColor(prevIcon, prevColor);
  localStorage.setItem('currentColor', currentColor);
  localStorage.setItem('prevColor', prevColor);
}

function handleToolsApply(tool) {
  switch (tool) {
    case 'pencil':
      canvas.removeEventListener('click', getPixelColor);
      canvas.removeEventListener('click', clearCanvas);
      canvas.removeEventListener('click', fillCanvas);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      return;
    case 'fill':
      canvas.removeEventListener('click', getPixelColor);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('click', fillCanvas);
      return;
    case 'color':
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', clearCanvas);
      canvas.removeEventListener('click', fillCanvas);
      canvas.addEventListener('click', getPixelColor);
      return;
    case 'clear':
      clearCanvas();
      break;
    default: break;
  }
}

function setInitalValues() {
  const currentColorFromStorage = localStorage.getItem('currentColor');
  const prevColorFromStorage = localStorage.getItem('prevColor');
  const pixelsFromStorage = localStorage.getItem('pixels');
  const selectedToolFromStorage = localStorage.getItem('selectedTool');
  const savedImage = localStorage.getItem('saved data');

  if (currentColorFromStorage) {
    currentColor = currentColorFromStorage;
    setIconColor(colorPickerIcon, currentColor);
  } else {
    setIconColor(colorPickerIcon, currentColor);
    localStorage.setItem('currentColor', currentColor);
  }

  if (prevColorFromStorage) {
    prevColor = prevColorFromStorage;
    setIconColor(prevIcon, prevColor);
  } else {
    setIconColor(prevIcon, prevColor);
    localStorage.setItem('prevColor', prevColor);
  }

  if (pixelsFromStorage) {
    pixels = pixelsFromStorage;
    scale = fieldSize / pixels;
  } else {
    localStorage.setItem('pixels', pixels);
    scale = fieldSize / pixels;
  }

  if (selectedToolFromStorage) {
    selectedTool = selectedToolFromStorage;
  } else {
    localStorage.setItem('selectedTool', selectedTool);
  }
  if (savedImage) {
    restoreImage();
  }
}

function setPixelSize(e) {
  pixels = e.target.dataset.pixels;
  scale = fieldSize / pixels;
  localStorage.setItem('pixels', pixels);
}
document.addEventListener('DOMContentLoaded', () => {
  setInitalValues();
  prevColorLabel.addEventListener('click', setPrevColor);
  colorPicker.addEventListener('change', setColor);
  redLabel.addEventListener('click', setColorToRed);
  blueLabel.addEventListener('click', setColorToBlue);
  pixelOptionsList.addEventListener('click', setPixelSize);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  toolsList.addEventListener('click', (e) => {
    selectedTool = e.target.parentNode.dataset.tool;
    setSelectedTool(selectedTool);
    handleToolsApply(selectedTool);
  });
  document.addEventListener('keypress', (e) => {
    const pressedKey = e.code;
    if (!Object.keys(hotKeys).includes(pressedKey)) return;
    setSelectedTool(hotKeys[pressedKey]);
    handleToolsApply(hotKeys[pressedKey]);
  });
});
