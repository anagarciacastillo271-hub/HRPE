/* ==========================================================================
   PANAMÁ HISTÓRICO - LÓGICA DE INTERACTIVIDAD JAVASCRIPT
   Fuerte San Lorenzo & El Canal de Panamá (Simulador de Esclusas)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de componentes
  initAudioSynthesizer();
  initLockSimulator();
  initHotspots();
  initTimeline();
  initInteractiveMap();
  initTriviaQuiz();
  initSearch();
  initNavScroll();
  initMobileMenu();
});

/* --------------------------------------------------------------------------
   1. SINTETIZADOR DE AUDIO WEB (EFECTOS AMBIENTALES Y SONIDOS)
   -------------------------------------------------------------------------- */
let audioCtx = null;
let isSoundEnabled = false;

function initAudioSynthesizer() {
  const soundBtn = document.getElementById('toggleSoundBtn');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isSoundEnabled = !isSoundEnabled;
    soundBtn.classList.toggle('active-sound', isSoundEnabled);

    if (isSoundEnabled) {
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      playShipHornSound();
    } else {
      soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  });
}

// Sonido de Bocina de Barco en el Canal (Frecuencia grave modulada)
function playShipHornSound() {
  if (!audioCtx || !isSoundEnabled) return;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
  osc2.frequency.setValueAtTime(114, audioCtx.currentTime); // Batimento

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start(audioCtx.currentTime);
  osc2.start(audioCtx.currentTime);

  osc1.stop(audioCtx.currentTime + 2.5);
  osc2.stop(audioCtx.currentTime + 2.5);
}

// Sonido de victoria/acierto en trivia
function playChimeSound() {
  if (!audioCtx || !isSoundEnabled) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
  osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
  osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

/* --------------------------------------------------------------------------
   2. SIMULADOR INTERACTIVO DE ESCLUSAS DEL CANAL DE PANAMÁ (HTML5 CANVAS)
   -------------------------------------------------------------------------- */
let currentStep = 0;
let isAutoSimulating = false;
let autoSimInterval = null;

const lockStepsInfo = [
  {
    step: 1,
    title: "1. Entrada desde el Océano",
    desc: "El barco de carga entra a la primera cámara al nivel del mar. Las compuertas de bisagra traseras se cierran firmemente."
  },
  {
    step: 2,
    title: "2. Cierre de Compuertas y Llenado por Gravedad",
    desc: "Se abren las válvulas subterráneas. El agua del Lago Gatún fluye por gravedad hacia la cámara. El barco comienza a elevarse sin necesidad de bombas."
  },
  {
    step: 3,
    title: "3. Elevación Máxima a Nivel del Lago (26m s.n.m.)",
    desc: "Tras pasar por las tres cámaras (Baja, Media y Alta), la nave alcanza los 26 metros de altura sobre el nivel del mar, igualando la elevación del Lago Gatún."
  },
  {
    step: 4,
    title: "4. Tránsito por el Lago Gatún y Corte Culebra",
    desc: "La nave navega 33 kilómetros cruzando la cuenca hidrográfica del Lago Gatún y la trinchera excavada en la cordillera (Corte Culebra)."
  },
  {
    step: 5,
    title: "5. Descenso al Océano Opuesto",
    desc: "El proceso se invierte en las esclusas opuestas: el agua se vacía gradualmente por gravedad y el barco desciende para continuar su viaje oceánico."
  }
];

function initLockSimulator() {
  const canvas = document.getElementById('lockCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Botones de control del simulador
  const prevBtn = document.getElementById('simPrevStep');
  const nextBtn = document.getElementById('simNextStep');
  const autoBtn = document.getElementById('simAutoPlay');

  if (prevBtn) prevBtn.addEventListener('click', () => setStep(currentStep - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setStep(currentStep + 1));
  if (autoBtn) {
    autoBtn.addEventListener('click', () => {
      isAutoSimulating = !isAutoSimulating;
      autoBtn.classList.toggle('active', isAutoSimulating);
      autoBtn.innerHTML = isAutoSimulating ? 
        '<i class="fas fa-pause"></i> Pausar' : 
        '<i class="fas fa-play"></i> Auto Simulación';

      if (isAutoSimulating) {
        autoSimInterval = setInterval(() => {
          setStep((currentStep + 1) % lockStepsInfo.length);
        }, 4000);
      } else {
        clearInterval(autoSimInterval);
      }
    });
  }

  function setStep(stepIndex) {
    if (stepIndex < 0) stepIndex = lockStepsInfo.length - 1;
    if (stepIndex >= lockStepsInfo.length) stepIndex = 0;

    currentStep = stepIndex;
    updateStepBanner(currentStep);

    if (isSoundEnabled && currentStep === 1) {
      playShipHornSound();
    }
  }

  function updateStepBanner(index) {
    const info = lockStepsInfo[index];
    document.getElementById('stepBadgeNumber').textContent = info.step;
    document.getElementById('stepTitle').textContent = info.title;
    document.getElementById('stepDescription').textContent = info.desc;
  }

  // Bucle de Renderizado de Animación del Simulador
  let shipXRatio = 0.08;
  let targetShipXRatio = 0.08;
  let waterLevels = [0.25, 0.25, 0.25, 0.85]; // [Mar, Cámara 1, Cámara 2, Lago Gatún]
  let targetWaterLevels = [0.25, 0.25, 0.25, 0.85];

  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Calcular objetivos según el paso actual
    switch (currentStep) {
      case 0: // Entrada
        targetShipXRatio = 0.12;
        targetWaterLevels = [0.25, 0.25, 0.50, 0.85];
        break;
      case 1: // Llenado Cámara 1
        targetShipXRatio = 0.32;
        targetWaterLevels = [0.25, 0.50, 0.70, 0.85];
        break;
      case 2: // Elevación Máxima
        targetShipXRatio = 0.58;
        targetWaterLevels = [0.25, 0.70, 0.85, 0.85];
        break;
      case 3: // Tránsito Gatún
        targetShipXRatio = 0.78;
        targetWaterLevels = [0.25, 0.70, 0.85, 0.85];
        break;
      case 4: // Descenso
        targetShipXRatio = 0.90;
        targetWaterLevels = [0.25, 0.35, 0.35, 0.85];
        break;
    }

    // Interpolación suave (Lerp)
    shipXRatio += (targetShipXRatio - shipXRatio) * 0.05;
    for (let i = 0; i < waterLevels.length; i++) {
      waterLevels[i] += (targetWaterLevels[i] - waterLevels[i]) * 0.04;
    }

    // 1. Dibujar Estructura de Concreto de las Esclusas
    const chamberW = w / 4;
    ctx.fillStyle = "#1E293B";

    // Muros escalonados de concreto
    ctx.fillRect(0, h * 0.75, chamberW, h * 0.25);
    ctx.fillRect(chamberW, h * 0.65, chamberW, h * 0.35);
    ctx.fillRect(chamberW * 2, h * 0.45, chamberW, h * 0.55);
    ctx.fillRect(chamberW * 3, h * 0.15, chamberW, h * 0.85);

    // 2. Dibujar Agua en cada Cámara
    const drawWater = (x, width, levelRatio) => {
      const waterH = h * levelRatio;
      const waterY = h - waterH;

      const gradient = ctx.createLinearGradient(0, waterY, 0, h);
      gradient.addColorStop(0, '#00A896');
      gradient.addColorStop(1, '#028090');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, waterY, width, waterH);

      // Efecto de olas de superficie
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(x, waterY, width, 4);
    };

    drawWater(0, chamberW, waterLevels[0]);
    drawWater(chamberW, chamberW, waterLevels[1]);
    drawWater(chamberW * 2, chamberW, waterLevels[2]);
    drawWater(chamberW * 3, chamberW, waterLevels[3]);

    // 3. Dibujar Compuertas de las Esclusas (Barreras verticales)
    const drawGate = (x, isOpen) => {
      ctx.fillStyle = isOpen ? "#2A9D8F" : "#E76F51";
      const gateH = isOpen ? 20 : h * 0.4;
      ctx.fillRect(x - 6, h - gateH, 12, gateH);

      // Luces indicadoras
      ctx.fillStyle = isOpen ? "#10B981" : "#EF4444";
      ctx.beginPath();
      ctx.arc(x, h - gateH - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    drawGate(chamberW, currentStep > 0);
    drawGate(chamberW * 2, currentStep > 1);
    drawGate(chamberW * 3, currentStep > 2);

    // 4. Dibujar Barco Portacontenedores Interactivo
    const shipX = w * shipXRatio;
    
    // Determinar la altura del agua bajo el barco
    let currentChamberIndex = Math.floor(shipXRatio * 4);
    currentChamberIndex = Math.min(3, Math.max(0, currentChamberIndex));
    const shipWaterY = h - (h * waterLevels[currentChamberIndex]);

    const shipW = 90;
    const shipH = 32;
    const shipY = shipWaterY - shipH + 8;

    // Casco del barco
    ctx.fillStyle = "#DC2626"; // Rojo portacontenedores
    ctx.beginPath();
    ctx.moveTo(shipX - shipW / 2, shipY);
    ctx.lineTo(shipX + shipW / 2 - 15, shipY);
    ctx.lineTo(shipX + shipW / 2, shipY + shipH);
    ctx.lineTo(shipX - shipW / 2, shipY + shipH);
    ctx.closePath();
    ctx.fill();

    // Contenedores apilados
    const colors = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6"];
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = colors[c % colors.length];
      ctx.fillRect(shipX - shipW / 2 + 10 + (c * 16), shipY - 14, 14, 14);
    }

    // Cabina de mando
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(shipX - shipW / 2 + 5, shipY - 22, 16, 22);

    // Bandera de Panamá en el barco
    ctx.fillStyle = "#002B7F";
    ctx.fillRect(shipX - shipW / 2 + 6, shipY - 28, 6, 6);

    // 5. Mulas Eléctricas (Locomotoras de remolque)
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(shipX - 30, h * 0.73, 14, 8);
    ctx.fillRect(shipX + 20, h * 0.73, 14, 8);

    // Cables de remolque (Líneas finas)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shipX - 23, h * 0.73);
    ctx.lineTo(shipX - shipW / 2 + 5, shipY + 10);
    ctx.moveTo(shipX + 27, h * 0.73);
    ctx.lineTo(shipX + shipW / 2 - 10, shipY + 10);
    ctx.stroke();

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

/* --------------------------------------------------------------------------
   3. HOTSPOTS INTERACTIVOS EN EL FUERTE SAN LORENZO
   -------------------------------------------------------------------------- */
const hotspotData = {
  1: {
    title: "Foso y Muralla Colonial",
    desc: "Foso defensivo excavado en roca coralina. Servía de primera línea de defensa contra ataques piratas."
  },
  2: {
    title: "Los Cañones de Bronce",
    desc: "Artillería pesada española del siglo XVIII orientada estratégicamente hacia el Mar Caribe para repeler invasiones."
  },
  3: {
    title: "Casa del Castellano y Cuartel",
    desc: "Residencia del comandante militar del fuerte y almacén de armas y oro en tránsito hacia España."
  }
};

function initHotspots() {
  const hotspots = document.querySelectorAll('.hotspot');
  const tooltip = document.getElementById('hotspotTooltip');
  if (!tooltip) return;

  hotspots.forEach(spot => {
    spot.addEventListener('click', () => {
      const id = spot.getAttribute('data-id');
      const data = hotspotData[id];
      if (data) {
        tooltip.innerHTML = `
          <h4><i class="fas fa-shield-alt"></i> ${data.title}</h4>
          <p>${data.desc}</p>
        `;
        tooltip.style.display = 'block';

        if (isSoundEnabled) playChimeSound();
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. LÍNEA DEL TIEMPO INTERACTIVA
   -------------------------------------------------------------------------- */
function initTimeline() {
  const cards = document.querySelectorAll('.timeline-card');
  const progress = document.getElementById('timelineProgress');

  cards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const pct = ((idx + 1) / cards.length) * 100;
      if (progress) progress.style.width = `${pct}%`;
    });
  });
}

/* --------------------------------------------------------------------------
   5. MAPA INTERACTIVO Y UBICACIONES
   -------------------------------------------------------------------------- */
const locationDetails = {
  chagres: "La desembocadura del Río Chagres era la entrada principal para la navegación colonial transístmica.",
  sanlorenzo: "El Fuerte San Lorenzo protegía la boca del Río Chagres de invasiones piratas como la de Henry Morgan en 1671.",
  gatun: "El Lago Gatún fue el lago artificial más grande del mundo al momento de su creación en 1913.",
  esclusas: "Las Esclusas del Canal operan 100% con agua dulce proveniente del Río Chagres y Lago Gatún."
};

function initInteractiveMap() {
  const items = document.querySelectorAll('.location-item');
  const detailText = document.getElementById('locationDetailText');

  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const locKey = item.getAttribute('data-loc');
      if (detailText && locationDetails[locKey]) {
        detailText.textContent = locationDetails[locKey];
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. CUESTIONARIO DE TRIVIA "DESAFÍO ISTMEÑO"
   -------------------------------------------------------------------------- */
const triviaQuestions = [
  {
    q: "¿En qué año atacó el famoso pirata Henry Morgan el Fuerte San Lorenzo?",
    options: ["1595", "1671", "1740", "1914"],
    answer: 1
  },
  {
    q: "¿Cuántos metros sobre el nivel del mar elevan las esclusas a los barcos?",
    options: ["10 metros", "26 metros", "50 metros", "100 metros"],
    answer: 1
  },
  {
    q: "¿Cuál fue el primer barco en transitar oficialmente el Canal de Panamá en 1914?",
    options: ["SS Ancon", "Titanico", "Santa María", "Neopanamax One"],
    answer: 0
  },
  {
    q: "¿Qué recurso natural hace funcionar las esclusas sin necesidad de bombas de agua?",
    options: ["La energía eólica", "La fuerza de gravedad del agua", "Motores diésel", "Presión de vapor"],
    answer: 1
  }
];

let triviaIndex = 0;
let triviaScore = 0;

function initTriviaQuiz() {
  const qEl = document.getElementById('triviaQuestion');
  const optsEl = document.getElementById('triviaOptions');
  const scoreEl = document.getElementById('triviaScore');

  if (!qEl || !optsEl) return;

  function renderQuestion() {
    if (triviaIndex >= triviaQuestions.length) {
      qEl.textContent = "🎉 ¡Felicidades! Has completado el Desafío Istmeño.";
      optsEl.innerHTML = `
        <button class="btn btn-primary" onclick="resetTrivia()" style="grid-column: span 2;">
          <i class="fas fa-redo"></i> Volver a Jugar
        </button>
      `;
      return;
    }

    const currentQ = triviaQuestions[triviaIndex];
    qEl.textContent = `${triviaIndex + 1}. ${currentQ.q}`;
    optsEl.innerHTML = '';

    currentQ.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'trivia-btn';
      btn.textContent = optText;
      btn.addEventListener('click', () => checkAnswer(idx, btn));
      optsEl.appendChild(btn);
    });
  }

  function checkAnswer(selectedIdx, btnElement) {
    const currentQ = triviaQuestions[triviaIndex];
    const buttons = optsEl.querySelectorAll('.trivia-btn');

    buttons.forEach(b => b.disabled = true);

    if (selectedIdx === currentQ.answer) {
      btnElement.classList.add('correct');
      triviaScore += 25;
      if (scoreEl) scoreEl.textContent = `Puntaje: ${triviaScore} / 100`;
      playChimeSound();
    } else {
      btnElement.classList.add('incorrect');
      buttons[currentQ.answer].classList.add('correct');
    }

    setTimeout(() => {
      triviaIndex++;
      renderQuestion();
    }, 1800);
  }

  window.resetTrivia = function() {
    triviaIndex = 0;
    triviaScore = 0;
    if (scoreEl) scoreEl.textContent = `Puntaje: 0 / 100`;
    renderQuestion();
  };

  renderQuestion();
}

/* --------------------------------------------------------------------------
   7. BÚSQUEDA RÁPIDA E INTERACTIVA EN LA PÁGINA
   -------------------------------------------------------------------------- */
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;

    if (query.includes('lorenzo') || query.includes('fuerte') || query.includes('pirata')) {
      document.getElementById('fuerte-san-lorenzo')?.scrollIntoView({ behavior: 'smooth' });
    } else if (query.includes('canal') || query.includes('esclusa') || query.includes('barco')) {
      document.getElementById('canal-panama')?.scrollIntoView({ behavior: 'smooth' });
    } else if (query.includes('mapa') || query.includes('chagres')) {
      document.getElementById('mapa-interactivo')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* --------------------------------------------------------------------------
   8. NAVEGACIÓN SUAVE Y SPY DE SECCIONES
   -------------------------------------------------------------------------- */
function initNavScroll() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop - 120) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   9. MENÚ DE NAVEGACIÓN MÓVIL (HAMBURGER TOGGLE)
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!menuBtn || !navMenu) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('mobile-open');
    menuBtn.classList.toggle('active-menu', isOpen);
    menuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('mobile-open');
      menuBtn.classList.remove('active-menu');
      menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}
