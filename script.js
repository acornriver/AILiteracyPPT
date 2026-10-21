document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const slides = document.querySelectorAll('.slide');
  const slidesContainer = document.getElementById('slidesContainer');
  const slideDotsContainer = document.getElementById('slideDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const notesToggleBtn = document.getElementById('notesToggleBtn');
  const notesDrawer = document.getElementById('notesDrawer');
  const notesCloseBtn = document.getElementById('notesCloseBtn');
  const notesContent = document.getElementById('notesContent');
  const notesDuration = document.getElementById('notesDuration');
  const notesSlideTitle = document.getElementById('notesSlideTitle');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerTime = document.getElementById('timerTime');
  
  // Cinema Modal Elements
  const cinemaModal = document.getElementById('cinemaModal');
  const cinemaCloseBtn = document.getElementById('cinemaCloseBtn');
  const cinemaModalTitle = document.getElementById('cinemaModalTitle');
  const cinemaIframe = document.getElementById('cinemaIframe');

  let currentSlideIndex = 0;
  const totalSlides = slides.length;

  // Web Audio Context for Interactive Sound Effects
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 1. Responsive Scaling for 1920x1080 Aspect Ratio
  function updateSlideScale() {
    if (window.matchMedia('print').matches) return;
    
    const baseWidth = 1920;
    const baseHeight = 1080;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const padding = 20;
    const availableWidth = windowWidth - padding;
    const availableHeight = windowHeight - padding;

    const scaleX = availableWidth / baseWidth;
    const scaleY = availableHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY, 1.0);

    slidesContainer.style.transform = `scale(${scale})`;
  }

  window.addEventListener('resize', updateSlideScale);
  updateSlideScale();

  // 2. Navigation Dots
  slides.forEach((slide, index) => {
    const dot = document.createElement('div');
    dot.classList.add('slide-dot');
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('title', `슬라이드 ${index + 1}: ${slide.dataset.title || ''}`);
    dot.addEventListener('click', () => goToSlide(index));
    slideDotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.slide-dot');

  const progressFill = document.getElementById('progressFill');

  // Go To Slide
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');

    currentSlideIndex = index;

    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');

    if (progressFill) progressFill.style.width = `${((index + 1) / totalSlides) * 100}%`;

    updateNotes();
    startTimerIfNeeded();
  }

  function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  // 3. Speaker Notes
  function updateNotes() {
    const currentSlide = slides[currentSlideIndex];
    const note = currentSlide.dataset.note || '작성된 발표자 노트가 없습니다.';
    const duration = currentSlide.dataset.duration || '약 35초';
    const title = currentSlide.dataset.title || `슬라이드 ${currentSlideIndex + 1}`;

    notesContent.innerHTML = note;
    notesDuration.textContent = duration;
    notesSlideTitle.textContent = `${currentSlideIndex + 1}장 · ${title}`;
  }

  function toggleNotes() {
    notesDrawer.classList.toggle('open');
    const isOpen = notesDrawer.classList.contains('open');
    document.body.classList.toggle('notes-open', isOpen);
    notesToggleBtn.classList.toggle('active', isOpen);
    showHud();
  }

  // HUD auto-hide: fades out after a few idle seconds so it never covers the slide
  let hudTimer = null;
  function showHud() {
    document.body.classList.remove('hud-idle');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => {
      if (notesDrawer.classList.contains('open') || cinemaModal.classList.contains('open')) return;
      document.body.classList.add('hud-idle');
    }, 3000);
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, showHud, { passive: true })
  );
  showHud();

  notesToggleBtn.addEventListener('click', toggleNotes);
  notesCloseBtn.addEventListener('click', toggleNotes);

  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // 4. Timer Logic
  let timerInterval = null;
  let timerSeconds = 0;
  let timerRunning = false;

  function startTimerIfNeeded() {
    if (!timerRunning && currentSlideIndex > 0) {
      startTimer();
    }
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds++;
      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const secs = String(timerSeconds % 60).padStart(2, '0');
      timerTime.textContent = `${mins}:${secs}`;
      
      // Color warning after 5 min
      if (timerSeconds >= 300) {
        timerDisplay.style.borderColor = 'var(--accent-orange)';
        timerDisplay.style.color = 'var(--accent-orange)';
      }
    }, 1000);
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.style.opacity = '0.6';
    } else {
      startTimer();
      timerDisplay.style.opacity = '1';
    }
  }

  timerDisplay.addEventListener('click', toggleTimer);

  // 5. Cinema Video Modal
  window.openCinemaModal = function(youtubeId, title, startTime = 0) {
    if (!youtubeId) return;
    cinemaModalTitle.textContent = title || '작품 영상 감상';
    cinemaIframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${startTime}&rel=0`;
    cinemaModal.classList.add('open');
  };

  window.closeCinemaModal = function() {
    cinemaModal.classList.remove('open');
    cinemaIframe.src = '';
  };

  cinemaCloseBtn.addEventListener('click', window.closeCinemaModal);
  cinemaModal.addEventListener('click', (e) => {
    if (e.target === cinemaModal) window.closeCinemaModal();
  });

  // 6. Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Escape') {
      if (cinemaModal.classList.contains('open')) {
        window.closeCinemaModal();
        return;
      }
      if (notesDrawer.classList.contains('open')) {
        toggleNotes();
        return;
      }
    }

    switch (e.code) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'Space':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'KeyN':
        e.preventDefault();
        toggleNotes();
        break;
      case 'KeyF':
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        break;
      case 'KeyV':
        e.preventDefault();
        // Trigger current slide's primary video if present
        const currentSlide = slides[currentSlideIndex];
        const primaryPlayBtn = currentSlide.querySelector('.media-play-overlay, .trigger-primary-video');
        if (primaryPlayBtn) primaryPlayBtn.click();
        break;
    }
  });

  // ==================== INTERACTIVE ART DEMO SCRIPTS ====================

  // Tab Switchers within Cards
  document.querySelectorAll('.card-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentCard = btn.closest('.art-card') || btn.closest('.slide');
      const targetId = btn.dataset.target;
      
      parentCard.querySelectorAll('.card-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      parentCard.querySelectorAll('.tab-view-content').forEach(view => {
        view.style.display = (view.id === targetId) ? 'flex' : 'none';
      });
    });
  });

  // Demo 1: Morse Code Audio Oscillator (Slide 3)
  const morseBulb = document.getElementById('morseLightBulb');
  const morseInput = document.getElementById('morseInput');
  const morsePlayBtn = document.getElementById('morsePlayBtn');
  const morseDisplay = document.getElementById('morseDisplay');

  const MORSE_MAP = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': ' / '
  };

  function playTone(durationMs) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch(e) {}
  }

  function playMorseSequence(text) {
    const chars = text.toUpperCase().split('');
    let sequence = [];

    chars.forEach(char => {
      const morse = MORSE_MAP[char] || '';
      for (let sym of morse) {
        if (sym === '.') {
          sequence.push({ on: true, dur: 120 });
          sequence.push({ on: false, dur: 120 });
        } else if (sym === '-') {
          sequence.push({ on: true, dur: 360 });
          sequence.push({ on: false, dur: 120 });
        } else if (sym === ' ') {
          sequence.push({ on: false, dur: 300 });
        }
      }
      sequence.push({ on: false, dur: 240 });
    });

    let morseStr = chars.map(c => MORSE_MAP[c] || '').join(' ');
    morseDisplay.textContent = morseStr;

    let delay = 0;
    sequence.forEach(step => {
      setTimeout(() => {
        if (step.on) {
          morseBulb.classList.add('lit');
          playTone(step.dur);
        } else {
          morseBulb.classList.remove('lit');
        }
      }, delay);
      delay += step.dur;
    });
  }

  if (morsePlayBtn) {
    morsePlayBtn.addEventListener('click', () => {
      const text = morseInput.value || 'AI';
      playMorseSequence(text);
    });
  }

  // Demo 2: Thermal Printer Simulation (Slide 4)
  const thermalPrintBtn = document.getElementById('thermalPrintBtn');
  const thermalTextInput = document.getElementById('thermalTextInput');
  const thermalPaperSlot = document.getElementById('thermalPaperSlot');

  function playThermalNoise() {
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.05;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2400;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
    } catch(e) {}
  }

  if (thermalPrintBtn) {
    thermalPrintBtn.addEventListener('click', () => {
      const text = thermalTextInput.value.trim() || '어둠 속에서 부유하던 당신의 말은 이제 소멸합니다.';
      playThermalNoise();
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      const safeText = text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      thermalPaperSlot.innerHTML = `
        <div class="thermal-paper printing">
          <div style="text-align: center; border-bottom: 1px dashed #666; padding-bottom: 6px; margin-bottom: 8px;">
            <strong>[감열–소각]</strong><br>
            <span style="font-size: 11px; color: #666;">${timeStr}</span>
          </div>
          <p style="font-size: 15px; line-height: 1.55; margin-bottom: 8px;">"${safeText}"</p>
          <div style="font-size: 11px; color: #888; text-align: right; border-top: 1px dotted #aaa; padding-top: 4px;">
            ||||| | ||| || |||| |
          </div>
        </div>
      `;
    });
  }

  // Demo 3: MMG Biosignal Oscilloscope (Slide 5)
  const oscCanvas = document.getElementById('mmgOscCanvas');
  const flexMuscleBtn = document.getElementById('flexMuscleBtn');
  const oscPacketDisplay = document.getElementById('oscPacketDisplay');

  let oscPhase = 0;
  let flexIntensity = 0;

  if (oscCanvas) {
    const ctx = oscCanvas.getContext('2d');
    function drawOscilloscope() {
      const w = oscCanvas.width = oscCanvas.offsetWidth;
      const h = oscCanvas.height = oscCanvas.offsetHeight;
      
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // MMG Waveform (Low Frequency Muscle Rumble)
      ctx.beginPath();
      ctx.strokeStyle = flexIntensity > 0.1 ? '#ff5e3a' : '#00f2fe';
      ctx.lineWidth = flexIntensity > 0.1 ? 3 : 1.8;
      ctx.shadowBlur = flexIntensity > 0.1 ? 14 : 4;
      ctx.shadowColor = flexIntensity > 0.1 ? '#ff5e3a' : '#00f2fe';

      const centerY = h / 2;
      for (let x = 0; x < w; x++) {
        const freq1 = 0.04;
        const freq2 = 0.09;
        const baseAmp = 6 + flexIntensity * 42;
        const noise = (Math.random() - 0.5) * (2 + flexIntensity * 16);
        const y = centerY + 
          Math.sin(x * freq1 + oscPhase) * baseAmp + 
          Math.cos(x * freq2 - oscPhase * 0.7) * (baseAmp * 0.4) + noise;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      oscPhase += 0.12 + flexIntensity * 0.2;
      flexIntensity *= 0.94; // Decay

      requestAnimationFrame(drawOscilloscope);
    }
    requestAnimationFrame(drawOscilloscope);

    if (flexMuscleBtn) {
      flexMuscleBtn.addEventListener('click', () => {
        flexIntensity = 1.0;
        
        // Deep sub-bass MMG sound simulation
        try {
          const actx = getAudioContext();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(45, actx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(25, actx.currentTime + 0.5);
          gain.gain.setValueAtTime(0.3, actx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start();
          osc.stop(actx.currentTime + 0.5);
        } catch(e) {}

        const val = (Math.random() * 0.3 + 0.7).toFixed(3);
        oscPacketDisplay.textContent = `[OSC TRIGGER SENT] ${val}`;
        oscPacketDisplay.style.borderColor = '#ff5e3a';
        oscPacketDisplay.style.color = '#ff5e3a';
        setTimeout(() => {
          oscPacketDisplay.style.borderColor = 'rgba(0, 242, 254, 0.2)';
          oscPacketDisplay.style.color = 'var(--accent-cyan)';
        }, 1200);
      });
    }
  }

  // Demo 4: AI Failure & Amp Heat Burnout (Slide 6)
  const heatMeter = document.getElementById('ampHeatMeter');
  const heatStatus = document.getElementById('ampHeatStatus');
  const test100wBtn = document.getElementById('test100wBtn');
  const testLowWattBtn = document.getElementById('testLowWattBtn');
  const ampLogConsole = document.getElementById('ampLogConsole');

  if (test100wBtn && testLowWattBtn) {
    test100wBtn.addEventListener('click', () => {
      heatMeter.classList.add('danger');
      heatStatus.textContent = '과부하 · 트랜스듀서 손상';
      heatStatus.style.color = '#ff3344';
      ampLogConsole.innerHTML = `
        <span style="color: #ff4455;">[ALERT] 추천 조합으로 구동 → 트랜스듀서 손상 반복</span><br>
        <span style="color: #888;">전압이 맞지 않는다고 판단 (체험용 시뮬레이션)</span>
      `;
    });

    testLowWattBtn.addEventListener('click', () => {
      heatMeter.classList.remove('danger');
      heatStatus.textContent = '정상 범위';
      heatStatus.style.color = 'var(--accent-cyan)';
      ampLogConsole.innerHTML = `
        <span style="color: var(--accent-cyan);">[RESOLVED] 출력이 낮은 앰프로 교체 → 안정적으로 구동</span><br>
        <span style="color: #888;">체험용 시뮬레이션 · 실제 측정값이 아닙니다.</span>
      `;
    });
  }

  // 7. Ambient Digital Noise Canvas Background
  const canvas = document.getElementById('resonanceCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1
      });
    }

    function animateResonance() {
      ctx.clearRect(0, 0, width, height);

      // Subtle noise wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
      ctx.lineWidth = 1;
      const t = Date.now() * 0.001;
      for (let x = 0; x < width; x += 15) {
        const y = height * 0.6 + Math.sin(x * 0.005 + t) * 60 + Math.cos(x * 0.01 - t * 0.5) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(160, 200, 255, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      requestAnimationFrame(animateResonance);
    }
    requestAnimationFrame(animateResonance);
  }

  // Initial Notes update
  updateNotes();
});
