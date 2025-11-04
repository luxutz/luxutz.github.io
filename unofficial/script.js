// ===== DARK MODE TOGGLE =====
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'enabled') {
  body.classList.add('dark-mode');
}

darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  
  // Save preference
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
  } else {
    localStorage.setItem('darkMode', 'disabled');
  }
});

// ===== PARALLAX EFFECT =====
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  if (hero) {
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .intro, .features, .kurssit-intro, .kurssit-lista, .contact-info, .kurssit-lista table, .contact-info iframe, .social-icons-yhteystiedot').forEach(el => {
  el.classList.add('animate-fade');
  observer.observe(el);
});

// ===== PARTICLE EFFECT =====
class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5;
    this.opacity = Math.random() * 0.5 + 0.2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x > this.canvas.width || this.x < 0) {
      this.speedX *= -1;
    }
    if (this.y > this.canvas.height || this.y < 0) {
      this.speedY *= -1;
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const hero = document.querySelector('.hero');
  
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;

  const particles = [];
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(canvas));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw(ctx);
    });

    // Draw connections between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  // Resize canvas on window resize
  window.addEventListener('resize', () => {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  });
}

// Initialize particles when DOM is loaded
if (document.querySelector('.hero')) {
  initParticles();
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== FLOATING ANIMATION FOR FEATURE ICONS =====
document.querySelectorAll('.feature-icon').forEach((icon, index) => {
  icon.style.animation = `float 3s ease-in-out ${index * 0.2}s infinite`;
});

// ===== STAGGERED TABLE ROW ANIMATIONS (refined) =====
(function setupCourseRowAnimations(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tbodies = document.querySelectorAll('.kurssit-lista table tbody');
  if (!tbodies.length) return;

  // Prepare rows with per-table stagger and vertical reveal
  tbodies.forEach(tbody => {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach((row, i) => {
      if (reduced) {
        row.style.opacity = '1';
        row.style.transform = 'none';
        row.style.transition = '';
        return;
      }
      const delay = Math.min(i * 0.08, 0.4); // clamp to keep snappy
      row.style.opacity = '0';
      row.style.transform = 'translateY(10px)';
      row.style.transition = `opacity 360ms ease ${delay}s, transform 360ms ease ${delay}s`;
    });
  });

  if (reduced) return;

  const tableRowObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
        obs.unobserve(row);
      }
    });
  }, { root: null, rootMargin: '150px 0px 120px 0px', threshold: 0.1 });

  // Observe all rows
  document.querySelectorAll('.kurssit-lista table tbody tr').forEach(row => tableRowObserver.observe(row));
})();

// ===== CURSOR TRAIL EFFECT (subtle) =====
let cursorTrail = [];
const trailLength = 10;

document.addEventListener('mousemove', (e) => {
  cursorTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
  
  if (cursorTrail.length > trailLength) {
    cursorTrail.shift();
  }
});

// ===== TYPING EFFECT FOR HERO H2 =====
function typeWriter() {
  const element = document.querySelector('.hero h2');
  if (!element) return;
  
  const text = element.textContent;
  element.textContent = '';
  element.style.opacity = '1';
  let i = 0;
  
  const interval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 50);
}

// Start typing effect after a delay
setTimeout(typeWriter, 500);

// ===== SCROLL PROGRESS INDICATOR =====
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  progressBar.style.width = scrolled + '%';
});

// ===== BUTTON RIPPLE EFFECT =====
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    this.appendChild(ripple);

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    setTimeout(() => ripple.remove(), 600);
  });
});
