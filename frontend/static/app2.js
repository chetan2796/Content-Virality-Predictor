/**
 * Content Virality Predictor — Frontend Logic
 */

const API_BASE = window.location.origin + "/api";

// ── Character Counter ──────────────────────────────────────────────────────
const scriptTextarea = document.getElementById("script");
const charCount = document.getElementById("char-count");
if (scriptTextarea && charCount) {
  scriptTextarea.addEventListener("input", () => {
    charCount.textContent = scriptTextarea.value.length;
  });
}

// ── Tab Switching ──────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.remove("hidden");
    
    // Google Analytics Event
    if (typeof gtag === 'function') {
      gtag('event', 'tab_switch', {
        'tab_name': tab
      });
    }
  });
});

// ── CTA Clicks ─────────────────────────────────────────────────────────────
['hero-cta', 'nav-cta'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'cta_click', { 'button_id': id });
      }
    });
  }
});

// ── Utility ───────────────────────────────────────────────────────────────
function showError(msg) {
  const existing = document.querySelector(".error-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "error-toast";
  toast.textContent = "❌ " + msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled = isLoading;
  if (text) text.classList.toggle("hidden", isLoading);
  if (loader) loader.classList.toggle("hidden", !isLoading);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function scoreColor(score) {
  if (score >= 70) return "#4ade80";
  if (score >= 45) return "#facc15";
  return "#f87171";
}

function formatPercent(val) {
  if (typeof val === "number") return (val * 100).toFixed(0) + "%";
  return val + "%";
}

// ── SVG Score Ring ─────────────────────────────────────────────────────────
function buildScoreRing(score) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return `
    <svg class="score-ring-container" width="100" height="100" viewBox="0 0 100 100">
      <circle class="score-ring-bg" cx="50" cy="50" r="${radius}" />
      <circle
        class="score-ring-fill"
        cx="50" cy="50" r="${radius}"
        stroke="${color}"
        stroke-dasharray="${circ}"
        stroke-dashoffset="${circ}"
        data-target="${offset}"
        id="ring-fill"
      />
      <text class="score-ring-text-val" x="50" y="46" font-family="Inter,sans-serif">${score}</text>
      <text class="score-ring-text-label" x="50" y="60" font-family="Inter,sans-serif">/ 100</text>
    </svg>
  `;
}

function animateRing() {
  const ring = document.getElementById("ring-fill");
  if (!ring) return;
  const target = parseFloat(ring.dataset.target);
  setTimeout(() => {
    ring.style.strokeDashoffset = target;
  }, 100);
}

// ── Render Full Virality Report ────────────────────────────────────────────
// ── Swarm Visualization Class ──
class SwarmVisualization {
  constructor(canvasId, agents) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    
    // Config: Massive swarm for complex network feel
    this.totalAgents = 150; 
    this.agents = [];
    this.particles = []; // Floating communication packets
    this.connections = []; // edges
    
    this.resize();
    this.init(agents);
    
    this.animationId = null;
    window.addEventListener("resize", () => this.resize());
    this.canvas.onclick = (e) => this.handleClick(e);
    
    // Camera state
    this.mouseX = this.canvas.width / 2;
    this.mouseY = this.canvas.height / 2;
    this.canvas.onmousemove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
  }

  init(coreAgents) {
    // 1. Create Core Agents
    for (let i = 0; i < coreAgents.length; i++) {
      this.agents.push(this.createAgent(coreAgents[i], true));
    }
    
    // 2. Fill with "Observer/Sub-nodes"
    for (let i = 0; i < this.totalAgents - coreAgents.length; i++) {
      this.agents.push(this.createAgent(null, false));
    }

    // 3. Network Construction: Connect observers to form massive star architectures
    const relations = ["RELATES_TO", "REPORTS_ON", "COLLABORATES_WITH", "INFLUENCES", "SHARES", "FAVORITES"];
    
    for (let i = 0; i < this.agents.length; i++) {
       if (!this.agents[i].isCore) {
         // Connect to core agents
         const connects = 1 + Math.floor(Math.random() * 2);
         for (let j = 0; j < connects; j++) {
           const targetIdx = Math.floor(Math.random() * coreAgents.length);
           const relation = relations[Math.floor(Math.random() * relations.length)];
           this.connections.push({ a: i, b: targetIdx, rel: relation });
         }
         // Randomly connect to other non-core nodes
         if (Math.random() < 0.2) {
            const targetIdx = coreAgents.length + Math.floor(Math.random() * (this.totalAgents - coreAgents.length));
            if (targetIdx !== i) {
               this.connections.push({ a: i, b: targetIdx, rel: "FOLLOWS" });
            }
         }
       } else {
         // Core agents interconnected
         for (let j = 0; j < coreAgents.length; j++) {
            if (i !== j && Math.random() < 0.6) {
               this.connections.push({ a: i, b: j, rel: "DRIVES_TREND" });
            }
         }
       }
    }
  }

  createAgent(data, isCore) {
    const colors = ["#ff9800", "#2196f3", "#4caf50", "#e91e63", "#9e9e9e"];
    const col = data ? this.getSentimentColor(data.sentiment) : colors[Math.floor(Math.random() * colors.length)];
    
    return {
      ...data,
      id: Math.random(),
      x: this.canvas.width / 2 + (Math.random() - 0.5) * 800,
      y: this.canvas.height / 2 + (Math.random() - 0.5) * 600,
      vx: 0,
      vy: 0,
      radius: isCore ? 6 + Math.random() * 4 : 2 + Math.random() * 3,
      color: col,
      isCore: isCore,
      pulse: Math.random() * Math.PI,
      active: false,
      mass: isCore ? 5 : 1
    };
  }

  getSentimentColor(s) {
    if (s === "positive") return "#4caf50";
    if (s === "negative") return "#f44336";
    return "#ff9800";
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = this.agents.find(a => {
      if (!a.isCore) return false;
      const dx = a.x - x;
      const dy = a.y - y;
      return Math.sqrt(dx * dx + dy * dy) < a.radius + 15;
    });

    if (clicked) {
      this.agents.forEach(a => a.active = false);
      clicked.active = true;
      showAgentDetail(clicked);
    }
  }

  update() {
    const K_REPULSE = 80;
    const K_SPRING = 0.003;
    const L_TARGET = 100;
    const CENTER_PULL = 0.0005;
    const DAMPING = 0.85;

    // Repulsion
    for (let i = 0; i < this.agents.length; i++) {
      let a = this.agents[i];
      // center pull
      a.vx += (this.canvas.width / 2 - a.x) * CENTER_PULL;
      a.vy += (this.canvas.height / 2 - a.y) * CENTER_PULL;

      for (let j = i + 1; j < this.agents.length; j++) {
        let b = this.agents[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        // Optimization: Only compute repulsion if close enough
        if (distSq < 25000 && distSq > 0.1) {
            let dist = Math.sqrt(distSq);
            let force = (K_REPULSE * a.mass * b.mass) / distSq;
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            a.vx += fx / a.mass;
            a.vy += fy / a.mass;
            b.vx -= fx / b.mass;
            b.vy -= fy / b.mass;
        }
      }
    }

    // Springs
    for (let i = 0; i < this.connections.length; i++) {
        let a = this.agents[this.connections[i].a];
        let b = this.agents[this.connections[i].b];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - L_TARGET) * K_SPRING;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        
        a.vx += fx / a.mass;
        a.vy += fy / a.mass;
        b.vx -= fx / b.mass;
        b.vy -= fy / b.mass;
    }

    // Physics step
    this.agents.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.vx *= DAMPING;
      a.vy *= DAMPING;

      // Subtle mouse effect
      if (a.isCore) {
        let dx = this.mouseX - a.x;
        let dy = this.mouseY - a.y;
        let dSq = dx * dx + dy * dy;
        if (dSq < 15000 && dSq > 1) {
            a.vx -= (dx / Math.sqrt(dSq)) * 0.2; // Slight push away
            a.vy -= (dy / Math.sqrt(dSq)) * 0.2;
        }
      }

      a.pulse += 0.05;
      
      // Spawn particles
      if (Math.random() < 0.05) {
         let targetConn = this.connections[Math.floor(Math.random() * this.connections.length)];
         if (targetConn.a === this.agents.indexOf(a)) {
            let target = this.agents[targetConn.b];
            this.particles.push({
               x: a.x, y: a.y, tx: target.x, ty: target.y,
               progress: 0, speed: 0.01 + Math.random() * 0.02, color: "#fff"
            });
         }
      }
    });

    // Particles step
    this.particles = this.particles.filter(p => {
       p.progress += p.speed;
       return p.progress < 1;
    });
  }

  draw() {
    this.ctx.fillStyle = "#0c0d10"; // Dark slightly blueish background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Abstract dot grid background
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 0; x < this.canvas.width; x += 20) {
        for (let y = 0; y < this.canvas.height; y += 20) {
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    // 1. Draw Static Connections (Vibrant pink lines simulating AI knowledge graph)
    this.ctx.lineWidth = 0.5;
    this.connections.forEach((conn, index) => {
      let a = this.agents[conn.a];
      let b = this.agents[conn.b];
      
      this.ctx.strokeStyle = `rgba(233, 30, 99, 0.3)`; // Bright pink lines
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();

      // Render relationship text occasionally to mimic Graph DB
      if (index % 12 === 0) {
          let midX = (a.x + b.x) / 2;
          let midY = (a.y + b.y) / 2;
          this.ctx.fillStyle = "rgba(255,255,255,0.4)";
          this.ctx.font = "6px Inter";
          this.ctx.textAlign = "center";
          this.ctx.fillText(conn.rel, midX, midY);
      }
    });

    // 2. Draw Moving Communication Particles
    this.particles.forEach(p => {
      let x = lerp(p.x, p.tx, p.progress);
      let y = lerp(p.y, p.ty, p.progress);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 3. Draw Nodes
    this.agents.forEach(a => {
      let glow = a.isCore ? Math.sin(a.pulse) * 5 + 5 : 0;
      this.ctx.shadowBlur = glow;
      this.ctx.shadowColor = a.color;
      
      this.ctx.fillStyle = a.color;
      
      if (a.active) {
        this.ctx.strokeStyle = "#fff";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(a.x, a.y, a.radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Labels
      if (a.isCore || a.radius > 3.5) {
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = a.isCore ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
        this.ctx.font = a.isCore ? "bold 10px Inter" : "7px Inter";
        this.ctx.textAlign = "center";
        
        let label = a.isCore ? a.agent_name.split(",")[0].toUpperCase() : "Node-" + Math.floor(a.id * 1000);
        this.ctx.fillText(label, a.x, a.y - a.radius - (a.isCore ? 6 : 3));
      }
    });
    this.ctx.shadowBlur = 0;

    this.update();
    this.animationId = requestAnimationFrame(() => this.draw());
  }
  
  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

let activeVisualization = null;

// ── Dashboard Rendering ───────────────────────────────────────────────────

function renderDashboard(r) {
  const content = document.getElementById("results-content");
  content.classList.remove("hidden");

  // Init Swarm
  if (activeVisualization) activeVisualization.stop();
  activeVisualization = new SwarmVisualization("swarm-canvas", r.agent_feedback);
  activeVisualization.draw();

  // Global Intel
  const intel = document.getElementById("global-stats-content");
  intel.innerHTML = `
    <h3 class="panel-title">Intelligence Overview</h3>
    <div class="mini-stat-card">
      <div class="mini-stat-label">Virality Score</div>
      <div class="mini-stat-val" style="color:${scoreColor(r.virality_score)}">${r.virality_score}</div>
      <div class="mini-stat-sub">${verdictLabel(r.virality_score)}</div>
    </div>
    <div class="mini-stat-card">
      <div class="mini-stat-label">Agent Swarm Size</div>
      <div class="mini-stat-val">1,000+</div>
      <div class="mini-stat-sub">100 Live Interactive Nodes</div>
    </div>
    <div class="mini-stat-card">
      <div class="mini-stat-label">Share Potential</div>
      <div class="mini-stat-val" style="color:#8b5cf6">${formatPercent(r.share_probability)}</div>
      <div class="mini-stat-sub">Propensity to propagate</div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Sentiment Swarm</div>
      <div class="sentiment-bar">
        <div class="sentiment-seg seg-positive" style="width:${r.sentiment_breakdown.positive}%"></div>
        <div class="sentiment-seg seg-neutral" style="width:${r.sentiment_breakdown.neutral}%"></div>
        <div class="sentiment-seg seg-negative" style="width:${r.sentiment_breakdown.negative}%"></div>
      </div>
    </div>
    <p class="form-hint" style="margin-top:20px">👉 Click any agent node in the swarm to view its isolated reaction and monologues.</p>
  `;

  // Full Report (Bottom)
  renderReport(r, "full-report-content");
}

function showAgentDetail(a) {
  const sidebar = document.getElementById("node-details-sidebar");
  const body = document.getElementById("agent-detail-body");
  
  sidebar.classList.remove("hidden");
  
  // Google Analytics Event
  if (typeof gtag === 'function') {
    gtag('event', 'view_agent_detail', {
      'agent_name': a.agent_name,
      'sentiment': a.sentiment,
      'would_share': a.would_share
    });
  }

  body.innerHTML = `
    <div class="agent-intel-card">
      <div class="intel-tag-group">
        <span class="intel-tag">${a.sentiment.toUpperCase()}</span>
        <span class="intel-tag" style="background:rgba(255,255,255,0.05);color:#fff">
          ${a.would_share ? "VIRAL CARRIER" : "PASSIVE VIEWER"}
        </span>
      </div>
      <div>
        <div class="intel-title">Agent Name</div>
        <div class="intel-value">${a.agent_name}</div>
      </div>
      <div>
        <div class="intel-title">Persona Profile</div>
        <div class="intel-value" style="font-size:0.85rem">${a.persona}</div>
      </div>
      <div>
        <div class="intel-title">Internal Monologue / Reaction</div>
        <div class="intel-value" style="font-style:italic;color:var(--text-secondary)">"${a.reaction}"</div>
      </div>
    </div>
  `;
}

function closeSidebar() {
  document.getElementById("node-details-sidebar").classList.add("hidden");
  if (activeVisualization) {
    activeVisualization.agents.forEach(a => a.active = false);
  }
}

function resetSwarmView() {
  if (activeVisualization) {
    activeVisualization.agents.forEach(a => {
      a.x = Math.random() * activeVisualization.canvas.width;
      a.y = Math.random() * activeVisualization.canvas.height;
    });
  }
}

function metricCard(label, value, ratio, color) {
  return `
    <div class="metric-item">
      <div class="metric-label">${label}</div>
      <div class="metric-value" style="color:${color}">${value}</div>
      <div class="metric-bar">
        <div class="metric-bar-fill" style="width:${(ratio * 100).toFixed(0)}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function verdictLabel(score) {
  if (score >= 80) return "🔥 Viral Potential";
  if (score >= 65) return "📈 Strong Performer";
  if (score >= 45) return "📊 Average";
  if (score >= 25) return "📉 Below Average";
  return "❌ Likely to Flop";
}

function verdictEmoji(score) {
  if (score >= 80) return "🔥";
  if (score >= 65) return "📈";
  if (score >= 45) return "📊";
  return "📉";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Upload & Transcribe Video ───────────────────────────────────────────────
async function transcribeVideo() {
  const fileInput = document.getElementById("video_upload");
  if (!fileInput.files || fileInput.files.length === 0) {
    showError("Please select a video or audio file first.");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  setLoading("transcribe-btn", true);

  try {
    const res = await fetch(`${API_BASE}/transcribe`, {
      method: "POST",
      body: formData,
    });
    
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.detail || json.error || "Transcription failed");
    }

    const scriptArea = document.getElementById("script");
    if (scriptArea) {
      scriptArea.value = json.transcript;
      const event = new Event('input', { bubbles: true });
      scriptArea.dispatchEvent(event);
    }
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading("transcribe-btn", false);
  }
}

// ── Run Single Prediction ─────────────────────────────────────────────────
async function runPrediction() {
  const script = document.getElementById("script").value.trim();
  if (script.length < 20) {
    showError("Please enter at least 20 characters for your script or idea.");
    return;
  }

  const payload = {
    script,
    platform: document.getElementById("platform").value,
    audience: document.getElementById("audience").value,
    content_type: document.getElementById("content_type").value,
  };

  document.getElementById("results-placeholder").classList.add("hidden");
  document.getElementById("results-content").classList.add("hidden");

  // Google Analytics Event
  if (typeof gtag === 'function') {
    gtag('event', 'simulation_started', {
      'platform': payload.platform,
      'audience': payload.audience,
      'content_type': payload.content_type
    });
  }

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.detail || json.error || "Simulation failed");
    }

    renderDashboard(json.report);
    
    // Google Analytics Event
    if (typeof gtag === 'function') {
      gtag('event', 'simulation_completed', {
        'platform': payload.platform,
        'virality_score': json.report.virality_score,
        'share_probability': json.report.share_probability
      });
    }

    document.getElementById("results-content").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(err.message);
    
    // Google Analytics Event
    if (typeof gtag === 'function') {
      gtag('event', 'simulation_failed', {
        'error_message': err.message
      });
    }

    document.getElementById("results-placeholder").classList.remove("hidden");
  } finally {
    setLoading("predict-btn", false);
  }
}

// ── Run A/B Test ──────────────────────────────────────────────────────────
async function runABTest() {
  const scriptA = document.getElementById("script_a").value.trim();
  const scriptB = document.getElementById("script_b").value.trim();

  if (scriptA.length < 20 || scriptB.length < 20) {
    showError("Both scripts must be at least 20 characters.");
    return;
  }

  const payload = {
    script_a: scriptA,
    script_b: scriptB,
    platform: document.getElementById("ab_platform").value,
    audience: document.getElementById("ab_audience").value,
  };

  const abBtn = document.querySelector("#tab-abtest .btn");
  if (abBtn) {
    abBtn.disabled = true;
    const text = abBtn.querySelector(".btn-text");
    const loader = abBtn.querySelector(".btn-loader");
    if (text) text.classList.add("hidden");
    if (loader) loader.classList.remove("hidden");
  }

  const abResults = document.getElementById("ab-results");
  abResults.classList.add("hidden");

  // Google Analytics Event
  if (typeof gtag === 'function') {
    gtag('event', 'ab_test_started', {
      'platform': payload.platform,
      'audience': payload.audience
    });
  }

  try {
    const res = await fetch(`${API_BASE}/ab-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.detail || json.error || "A/B test failed");

    const r = json.report;
    const winnerName = r.winner === "tie" ? "🤝 It's a Tie!" : `Version ${r.winner} Wins`;

    abResults.innerHTML = `
      <div class="ab-results-grid">
        <div class="ab-winner-banner">
          <div class="ab-winner-label">A/B Test Result</div>
          <div class="ab-winner-name">${winnerName}</div>
          <div class="ab-comparison-text">${escapeHtml(r.comparison_summary)}</div>
        </div>
        <div>
          <h4 style="margin-bottom:12px;font-weight:700;color:var(--purple-500)">Version A — Score: ${r.version_a.virality_score}/100</h4>
          <div id="ab-report-a"></div>
        </div>
        <div>
          <h4 style="margin-bottom:12px;font-weight:700;color:var(--cyan-400)">Version B — Score: ${r.version_b.virality_score}/100</h4>
          <div id="ab-report-b"></div>
        </div>
      </div>
    `;
    abResults.classList.remove("hidden");
    renderReport(r.version_a, "ab-report-a");
    renderReport(r.version_b, "ab-report-b");
    
    // Google Analytics Event
    if (typeof gtag === 'function') {
      gtag('event', 'ab_test_completed', {
        'winner': r.winner,
        'score_a': r.version_a.virality_score,
        'score_b': r.version_b.virality_score
      });
    }

    abResults.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showError(err.message);

    // Google Analytics Event
    if (typeof gtag === 'function') {
      gtag('event', 'ab_test_failed', {
        'error_message': err.message
      });
    }
  } finally {
    if (abBtn) {
      abBtn.disabled = false;
      const text = abBtn.querySelector(".btn-text");
      const loader = abBtn.querySelector(".btn-loader");
      if (text) text.classList.remove("hidden");
      if (loader) loader.classList.add("hidden");
    }
  }
}

function renderReport(r, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sentimentPos = r.sentiment_breakdown?.positive ?? 0;
  const sentimentNeg = r.sentiment_breakdown?.negative ?? 0;
  const sentimentNeu = r.sentiment_breakdown?.neutral ?? 0;

  const agentCards = (r.agent_feedback || []).map(a => `
    <div class="agent-card ${a.sentiment}">
      <div class="agent-header">
        <span class="agent-name">${escapeHtml(a.agent_name)}</span>
        <span class="agent-share-tag ${a.would_share ? "share-yes" : "share-no"}">
          ${a.would_share ? "↗ Would Share" : "✗ Won't Share"}
        </span>
      </div>
      <div class="agent-reaction">"${escapeHtml(a.reaction)}"</div>
    </div>
  `).join("");

  const strengthItems = (r.strengths || []).map(s => `
    <div class="strength-item"><span class="item-icon">✅</span><span>${escapeHtml(s)}</span></div>
  `).join("");

  const weaknessItems = (r.weaknesses || []).map(w => `
    <div class="weakness-item">
      <div class="weakness-issue">⚠ ${escapeHtml(w.issue)}</div>
      <div class="weakness-suggestion">💡 ${escapeHtml(w.suggestion)}</div>
    </div>
  `).join("");

  const subScores = [
    { label: "Hook", val: r.hook_strength },
    { label: "Audience", val: r.audience_match },
    { label: "Platform", val: r.platform_fit },
  ].map(s => `
    <div class="sub-score">
      <div class="sub-score-val" style="color:${scoreColor(s.val * 10)}">${s.val}/10</div>
      <div class="sub-score-label">${s.label}</div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="score-header">
      ${buildScoreRing(r.virality_score)}
      <div class="score-details">
        <div class="score-verdict" style="color:${scoreColor(r.virality_score)}">
          ${verdictEmoji(r.virality_score)} ${verdictLabel(r.virality_score)}
        </div>
        <div class="score-verdict-sub">${escapeHtml(r.overall_verdict)}</div>
      </div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Key Metrics</div>
      <div class="metrics-grid">
        ${metricCard("Share Probability", formatPercent(r.share_probability), r.share_probability, "#8b5cf6")}
        ${metricCard("Est. Retention", formatPercent(r.estimated_retention), r.estimated_retention, "#22d3ee")}
        ${metricCard("Like/View Ratio", formatPercent(r.like_to_view_ratio), r.like_to_view_ratio, "#4ade80")}
      </div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Content Scores</div>
      <div class="sub-scores">${subScores}</div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Detailed Feedback</div>
      <div class="agent-cards">${agentCards}</div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Strengths</div>
      <div class="strengths-list">${strengthItems}</div>
    </div>
    <div class="report-section">
      <div class="report-section-title">Improvement Areas</div>
      <div class="weaknesses-list">${weaknessItems}</div>
    </div>
  `;
  setTimeout(animateRing, 50);
}
