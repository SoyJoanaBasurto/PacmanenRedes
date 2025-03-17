// Obtención del canvas y su contexto
const canvas = document.getElementById("gameCanvas"),
      ctx = canvas.getContext("2d");

// Variables globales
let score = 0, currentLevelIndex = 0, currentLevel, questionActive = false;
const player = { x: 0, y: 0, size: 20, speed: 5, mouthOpen: true };
let ghosts = [], questions = [];
let gameInterval;  // Para almacenar el intervalo del juego

// Audios del juego (se reinicia currentTime antes de reproducir para evitar solapamientos)
const sounds = {
  eat: new Audio("eat.mp3"),
  ghost: new Audio("ghost.mp3"),
  win: new Audio("win.mp3")
};
// Audio de la portada/fondo (se reproducirá con el clic del botón)
const coverAudio = new Audio("pacman.mp3");
coverAudio.loop = true;
coverAudio.volume = 1;

// --- Definición de niveles con laberintos lógicos ---
const levels = [
  { // Nivel 1: Corridor simple
    entrance: { x: 0, y: 170, width: 20, height: 60 },
    exit: { x: 380, y: 170, width: 20, height: 60 },
    playerStart: { x: 30, y: 190 },
    walls: [
      { x: 200, y: 0, width: 20, height: 150 },
      { x: 200, y: 190, width: 20, height: 210 }
    ],
    ghosts: [
      { x: 220, y: 100, size: 20, speed: 2, color: "red" }
    ],
    questions: [
      { x: 100, y: 180, text: "¿Protocolo dinámico?", options: ["TCP", "DHCP"], correct: 1 },
      { x: 150, y: 220, text: "¿Qué es NAT?", options: ["Traducción de direcciones de red", "Tipo de dirección estática"], correct: 0 },
      { x: 300, y: 180, text: "¿Capa de red?", options: ["Capa 2 (Enlace de datos)", "Capa 3 (Red)"], correct: 1 }
    ]
  },
  { // Nivel 2: Obstáculo adicional sin bloquear la ruta
    entrance: { x: 0, y: 170, width: 20, height: 60 },
    exit: { x: 380, y: 170, width: 20, height: 60 },
    playerStart: { x: 30, y: 190 },
    walls: [
      { x: 200, y: 0, width: 20, height: 150 },
      { x: 200, y: 190, width: 20, height: 210 },
      { x: 50, y: 240, width: 100, height: 20 }
    ],
    ghosts: [
      { x: 220, y: 100, size: 20, speed: 2, color: "red" },
      { x: 360, y: 100, size: 20, speed: 2, color: "blue" }
    ],
    questions: [
      { x: 80, y: 200, text: "¿Qué es IP?", options: ["Protocolo de identificación y direccionamiento", "Dirección física"], correct: 0 },
      { x: 150, y: 130, text: "¿Enrutamiento?", options: ["Función de la capa 3", "Función de la capa 4"], correct: 0 },
      { x: 300, y: 210, text: "¿Qué es TCP?", options: ["Protocolo de transporte confiable", "Protocolo más rápido que UDP"], correct: 0 },
      { x: 340, y: 180, text: "¿MAC es?", options: ["Dirección física", "Dirección lógica"], correct: 0 }
    ]
  },
  { // Nivel 3: Laberinto con camino sinuoso
    entrance: { x: 0, y: 150, width: 20, height: 60 },
    exit: { x: 380, y: 240, width: 20, height: 60 },
    playerStart: { x: 30, y: 170 },
    walls: [
      { x: 120, y: 0, width: 20, height: 90 },
      { x: 120, y: 150, width: 20, height: 230 },
      { x: 260, y: 200, width: 20, height: 100 },
      { x: 120, y: 130, width: 140, height: 20 }
    ],
    ghosts: [
      { x: 200, y: 100, size: 20, speed: 2, color: "red" },
      { x: 300, y: 300, size: 20, speed: 2, color: "blue" }
    ],
    questions: [
      { x: 80, y: 160, text: "¿Qué es DNS?", options: ["Sistema de nombres de dominio", "Tipo de protocolo"], correct: 0 },
      { x: 150, y: 110, text: "¿Qué es FTP?", options: ["Protocolo de transferencia de archivos", "Protocolo de seguridad"], correct: 0 },
      { x: 300, y: 200, text: "¿HTTP es?", options: ["Protocolo de comunicación", "Tipo de aplicación"], correct: 0 },
      { x: 340, y: 260, text: "¿Qué es SSH?", options: ["Protocolo seguro de acceso remoto", "Protocolo abierto sin cifrado"], correct: 0 }
    ]
  },
  { // Nivel 4: Laberinto con dos corredores
    entrance: { x: 0, y: 200, width: 20, height: 40 },
    exit: { x: 380, y: 200, width: 20, height: 40 },
    playerStart: { x: 30, y: 210 },
    walls: [
      { x: 50, y: 100, width: 300, height: 20 },
      { x: 50, y: 280, width: 300, height: 20 },
      { x: 150, y: 100, width: 20, height: 100 },
      { x: 250, y: 200, width: 20, height: 100 }
    ],
    ghosts: [
      { x: 300, y: 70, size: 20, speed: 2, color: "red" },
      { x: 70, y: 300, size: 20, speed: 2, color: "blue" },
      { x: 70, y: 70, size: 20, speed: 2, color: "orange" }
    ],
    questions: [
      { x: 80, y: 90, text: "¿Qué es ICMP?", options: ["Protocolo de control", "Protocolo de enrutamiento"], correct: 0 },
      { x: 340, y: 90, text: "¿Qué es ARP?", options: ["Resolución de direcciones", "Protocolo de cifrado"], correct: 0 },
      { x: 80, y: 290, text: "¿Qué es VLAN?", options: ["Red de área local virtual", "Red de área local física"], correct: 0 },
      { x: 340, y: 290, text: "¿Qué es SSL?", options: ["Capa de sockets seguros", "Capa de transporte insegura"], correct: 0 }
    ]
  },
  {  // Nivel 5: Laberinto final intrincado (modificado)
    entrance: { x: 0, y: 180, width: 20, height: 40 },
    exit: { x: 380, y: 180, width: 20, height: 40 },
    playerStart: { x: 30, y: 190 },
    walls: [
      // Muro en la izquierda con un hueco amplio (y=170 a y=220)
      { x: 80, y: 0, width: 20, height: 170 },
      { x: 80, y: 220, width: 20, height: 180 },
  
      // Muro central (solo cubre la parte inferior, hueco en la parte superior)
      { x: 200, y: 220, width: 20, height: 180 },
  
      // Muro en la derecha con hueco de y=140 a y=200
      { x: 320, y: 0, width: 20, height: 140 },
      { x: 320, y: 200, width: 20, height: 200 },
  
      // Barreras horizontales para complicar el paso
      { x: 80, y: 120, width: 120, height: 20 },
      { x: 200, y: 200, width: 120, height: 20 }
    ],
    ghosts: [
      { x: 100, y: 100, size: 20, speed: 2, color: "red" },
      { x: 300, y: 100, size: 20, speed: 2, color: "blue" },
      { x: 100, y: 300, size: 20, speed: 2, color: "pink" },
      { x: 300, y: 300, size: 20, speed: 2, color: "orange" }
    ],
    questions: [
      { x: 60,  y: 60,  text: "¿Qué es BGP?", options: ["Protocolo de enrutamiento", "Protocolo de seguridad"], correct: 0 },
      { x: 340, y: 60,  text: "¿Qué es OSPF?", options: ["Protocolo de enrutamiento", "Tecnología de switching"], correct: 0 },
      { x: 60,  y: 340, text: "¿Qué es MPLS?", options: ["Conmutación de etiquetas", "Tipo de red"], correct: 0 },
      { x: 340, y: 340, text: "¿Qué es VPN?", options: ["Red privada virtual", "Red pública"], correct: 0 }
    ]
  }
];

// Agregamos dos fantasmas extra a cada nivel para aumentar la dificultad
levels.forEach(level => {
  const additionalGhosts = [
    { x: 150, y: 50, size: 20, speed: 2, color: "green" },
    { x: 300, y: 250, size: 20, speed: 2, color: "purple" }
  ];
  level.ghosts = [...level.ghosts, ...additionalGhosts];
});

// Actualiza la barra de puntaje
function updateScoreBar() {
  document.getElementById("scoreBar").innerText =
    `Puntaje: ${score} | Nivel: ${currentLevelIndex + 1}`;
}

// Carga el nivel indicado
function loadLevel(index) {
  currentLevel = levels[index];
  player.x = currentLevel.playerStart.x;
  player.y = currentLevel.playerStart.y;
  // Reiniciamos fantasmas y preguntas para el nivel
  ghosts = JSON.parse(JSON.stringify(currentLevel.ghosts));
  questions = currentLevel.questions;
  updateScoreBar();
}

// Dibuja al jugador (efecto abrir/cerrar la boca)
function drawPlayer() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  const angleStart = player.mouthOpen ? 0.2 * Math.PI : 0,
        angleEnd   = player.mouthOpen ? 1.8 * Math.PI : 2 * Math.PI;
  ctx.arc(player.x, player.y, player.size / 2, angleStart, angleEnd);
  ctx.lineTo(player.x, player.y);
  ctx.fill();
  player.mouthOpen = !player.mouthOpen;
}

// Dibuja los fantasmas
function drawGhosts() {
  ghosts.forEach(g => {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Dibuja muros, entrada, salida y las "bolitas" de preguntas
function drawWalls() {
  currentLevel.walls.forEach(w => {
    ctx.fillStyle = "blue";
    ctx.fillRect(w.x, w.y, w.width, w.height);
  });
}
function drawEntrance() {
  const e = currentLevel.entrance;
  ctx.fillStyle = "green";
  ctx.fillRect(e.x, e.y, e.width, e.height);
}
function drawExit() {
  const ex = currentLevel.exit;
  ctx.fillStyle = "red";
  ctx.fillRect(ex.x, ex.y, ex.width, ex.height);
}
function drawQuestions() {
  ctx.fillStyle = "white";
  questions.forEach(q => {
    ctx.beginPath();
    ctx.arc(q.x, q.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Función de colisión: círculo vs. rectángulo
function circleRectCollision(cx, cy, r, rect) {
  let distX = Math.abs(cx - rect.x - rect.width / 2),
      distY = Math.abs(cy - rect.y - rect.height / 2);
  if (distX > (rect.width / 2 + r) || distY > (rect.height / 2 + r))
    return false;
  if (distX <= (rect.width / 2) || distY <= (rect.height / 2))
    return true;
  let dx = distX - rect.width / 2, dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= r * r);
}
function canMove(x, y, r) {
  // Evita que el jugador (o fantasmas) se salgan del canvas
  if (x - r < 0 || x + r > canvas.width || y - r < 0 || y + r > canvas.height)
    return false;
  return currentLevel.walls.every(w => !circleRectCollision(x, y, r, w));
}

// Muestra la pregunta en pantalla
function showQuestion(q, index) {
  const container = document.getElementById("questionContainer");
  container.innerHTML = `<p>${q.text}</p>`;
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => checkAnswer(i === q.correct, index);
    container.appendChild(btn);
  });
  container.style.display = "block";
}

// Verifica la respuesta y elimina la "bolita" si es correcta
function checkAnswer(correct, questionIndex) {
  if (correct) {
    alert("¡Correcto!");
    questions.splice(questionIndex, 1); // Elimina la pregunta (la bolita desaparece)
    score += 10;
    updateScoreBar();
  } else {
    alert("Incorrecto, intenta de nuevo.");
  }
  document.getElementById("questionContainer").style.display = "none";
  questionActive = false;
}

// Revisa colisiones entre jugador y fantasmas
function checkCollision() {
  ghosts.forEach(g => {
    if (Math.hypot(player.x - g.x, player.y - g.y) <
        (player.size / 2 + g.size / 2)) {
      alert("¡Te atraparon!");
      sounds.ghost.currentTime = 0;
      sounds.ghost.play();
      loadLevel(currentLevelIndex);
    }
  });
}

// Movimiento aleatorio de los fantasmas
function moveGhosts() {
  ghosts.forEach(g => {
    if (g.dx === undefined || g.dy === undefined) {
      let angle = Math.random() * 2 * Math.PI;
      g.dx = Math.cos(angle) * g.speed;
      g.dy = Math.sin(angle) * g.speed;
    }
    if (canMove(g.x + g.dx, g.y, g.size / 2)) {
      g.x += g.dx;
    } else {
      g.dx = -g.dx;
    }
    if (canMove(g.x, g.y + g.dy, g.size / 2)) {
      g.y += g.dy;
    } else {
      g.dy = -g.dy;
    }
    if (Math.random() < 0.02) {
      let angle = Math.random() * 2 * Math.PI;
      g.dx = Math.cos(angle) * g.speed;
      g.dy = Math.sin(angle) * g.speed;
    }
  });
}

// Función principal de actualización del juego
function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawEntrance();
  drawExit();
  drawWalls();
  drawQuestions();
  drawPlayer();
  drawGhosts();
  checkCollision();
  if (!questionActive) moveGhosts();
}

// Movimiento del jugador
document.addEventListener("keydown", e => {
  if (!questionActive) {
    let newX = player.x, newY = player.y;
    if (e.key === "ArrowUp") newY -= player.speed;
    if (e.key === "ArrowDown") newY += player.speed;
    if (e.key === "ArrowLeft") newX -= player.speed;
    if (e.key === "ArrowRight") newX += player.speed;
    if (canMove(newX, newY, player.size / 2)) {
      if (newX !== player.x || newY !== player.y) {
        sounds.eat.currentTime = 0;
        sounds.eat.play();
      }
      player.x = newX;
      player.y = newY;
    }
    // Revisa si el jugador alcanza una "bolita" de pregunta
    const reachedQ = questions.find((q, index) =>
      Math.abs(player.x - q.x) < 15 && Math.abs(player.y - q.y) < 15);
    if (reachedQ) {
      questionActive = true;
      showQuestion(reachedQ, questions.indexOf(reachedQ));
    }
    // Revisa si el jugador llegó a la salida
    const ex = currentLevel.exit;
    if (player.x >= ex.x && player.x <= ex.x + ex.width &&
        player.y >= ex.y && player.y <= ex.y + ex.height) {
      score += 100;
      sounds.win.currentTime = 0;
      sounds.win.play();
      currentLevelIndex++;
      if (currentLevelIndex >= levels.length) {
        // Al completar el último nivel, muestra mensaje sencillo de felicitaciones y botón de reinicio
        endGame();
      } else {
        alert("¡Nivel completado!");
        loadLevel(currentLevelIndex);
      }
    }
  }
});

// Función para finalizar el juego con un mensaje sencillo y botón de reinicio
function endGame() {
  clearInterval(gameInterval);
  // Creamos (o mostramos) un contenedor para el fin del juego
  let endContainer = document.getElementById("endGameContainer");
  if (!endContainer) {
    endContainer = document.createElement("div");
    endContainer.id = "endGameContainer";
    endContainer.innerHTML = `<p>¡Felicidades, completaste todos los niveles!</p>
                              <button id="startGame">
                                Reiniciar
                              </button>`;
    document.body.appendChild(endContainer);
    document.getElementById("startGame").addEventListener("click", () => {
      endContainer.style.display = "none";
      currentLevelIndex = 0;
      score = 0;
      loadLevel(currentLevelIndex);
      gameInterval = setInterval(updateGame, 100);
    });
  } else {
    endContainer.style.display = "block";
  }
}
function startGame() {
  coverAudio.currentTime = 0;
  coverAudio.play().catch(() => {});
  setTimeout(() => {
    coverAudio.volume = 0.3;
    document.getElementById("cover").style.display = "none";
    loadLevel(currentLevelIndex);
    gameInterval = setInterval(updateGame, 100);
  }, 500);
}
document.getElementById("startButton").addEventListener("click", startGame);