/**
 * Content Virality Predictor — Frontend Logic
 */

const API_BASE = "http://localhost:8000/api";

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
// ── Swarm Visualization Class ──────────────────────────────────────────────
class SwarmVisualization {
  constructor(canvasId, agents) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    
    // SWARM PROJECTION: Clone core agents to create a "thousand-agent" feel
    const swarmSize = 100;
    this.agents = [];
    
    for (let i = 0; i < swarmSize; i++) {
        const parent = agents[i % agents.length];
        this.agents.push({
          ...parent,
          id: i,
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 5 + Math.random() * 6,
          color: this.getSentimentColor(parent.sentiment),
          pulse: Math.random() * Math.PI,
          isCore: i < agents.length
        });
    }
    this.animationId = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.canvas.onclick = (e) => this.handleClick(e);
  }

  getSentimentColor(s) {
    if (s === "positive") return "#4ade80";
    if (s === "negative") return "#f87171";
    return "#facc15";
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
      const dx = a.x - x;
      const dy = a.y - y;
      return Math.sqrt(dx * dx + dy * dy) < a.radius + 10;
    });

    if (clicked) {
      this.agents.forEach(a => a.active = false);
      clicked.active = true;
      showAgentDetail(clicked);
    }
  }

  update() {
    this.agents.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;

      // Bounce
      if (a.x < a.radius || a.x > this.canvas.width - a.radius) a.vx *= -1;
      if (a.y < a.radius || a.y > this.canvas.height - a.radius) a.vy *= -1;

      // INDIVIDUALITY PHYSICS: Stronger repulsion, weaker global attraction
      this.agents.forEach(other => {
        if (a === other) return;
        const dx = other.x - a.x;
        const dy = other.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Strong repulsion when too close (prevents overlapping blocks)
        if (dist < 60) {
          a.vx -= dx * 0.005;
          a.vy -= dy * 0.005;
        } 
        // Very weak attraction to keep them on screen but not clumped
        else if (dist > 400) {
          a.vx += dx * 0.00002;
          a.vy += dy * 0.00002;
        }
      });

      // Speed limit
      const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (speed > 2) {
        a.vx = (a.vx / speed) * 2;
        a.vy = (a.vy / speed) * 2;
      }

      a.pulse += 0.05;
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Connections (Relationships)
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const a = this.agents[i];
        const b = this.agents[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Only connect very close nodes to avoid a "big web" look
        if (dist < 80) {
          this.ctx.strokeStyle = `rgba(139, 92, 246, ${0.4 - dist / 200})`;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw Nodes
    this.agents.forEach(a => {
      // Outer glow
      const glow = Math.sin(a.pulse) * 5 + 10;
      this.ctx.shadowBlur = glow;
      this.ctx.shadowColor = a.color;
      
      this.ctx.fillStyle = a.color;
      if (a.active) {
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "#fff";
        this.ctx.beginPath();
        this.ctx.arc(a.x, a.y, a.radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Label
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = "rgba(255,255,255,0.7)";
      this.ctx.font = "10px Inter";
      this.ctx.textAlign = "center";
      this.ctx.fillText(a.agent_name.split(",")[0], a.x, a.y + a.radius + 15);
    });

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
