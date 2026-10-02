// ══════════════════════════════════════════════════════════════════════════════
// CoursePage.js — Lógica y Renderizado del Manual Teórico & Exámenes PNA
// ══════════════════════════════════════════════════════════════════════════════

import { COURSE_NOTES, COURSE_QUIZZES } from './CourseNotes.js';

export class CoursePage {
  constructor() {
    this.activeFilter = 'modulo1Nomenclatura';
    this.searchQuery = '';
    this.answeredMap = this.loadAnswers();
    this.init();
  }

  loadAnswers() {
    try {
      const saved = localStorage.getItem('pna_quiz_answers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('No se pudo cargar progreso guardado:', e);
      return {};
    }
  }

  saveAnswers() {
    try {
      localStorage.setItem('pna_quiz_answers', JSON.stringify(this.answeredMap));
    } catch (e) {
      console.warn('No se pudo guardar progreso:', e);
    }
  }

  resolveAssetUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const cleanPath = url.replace(/^(\.\/|\/)+/, '');
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const repoName = (pathParts.length > 0 && !pathParts[0].endsWith('.html')) ? pathParts[0] : '';

    if (repoName && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      return `/${repoName}/${cleanPath}`;
    }
    return `./${cleanPath}`;
  }

  init() {
    this.createLightbox();
    this.bindNavigationDelegation();
    this.renderSidebar();
    this.renderMobilePills();
    this.renderContent();
    this.bindEvents();
    this.updateGlobalExamBadge();
  }

  createLightbox() {
    if (document.getElementById('sim-lightbox-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'sim-lightbox-modal';
    modal.className = 'sim-lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="sim-lightbox-backdrop"></div>
      <button class="sim-lightbox-close" id="btn-lightbox-close" aria-label="Cerrar imagen">✕</button>
      <div class="sim-lightbox-container">
        <img id="sim-lightbox-img" class="sim-lightbox-img" src="" alt="Lámina técnica en detalle" />
        <div id="sim-lightbox-caption" class="sim-lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (!e.target.closest('#sim-lightbox-img') && !e.target.closest('#sim-lightbox-caption')) {
        this.closeLightbox();
      }
    });

    const closeBtn = modal.querySelector('#btn-lightbox-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeLightbox();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeLightbox();
    });
  }

  closeLightbox() {
    const modal = document.getElementById('sim-lightbox-modal');
    if (modal) modal.classList.remove('open');
  }

  openLightbox(src, caption) {
    const modal = document.getElementById('sim-lightbox-modal');
    const img = document.getElementById('sim-lightbox-img');
    const cap = document.getElementById('sim-lightbox-caption');
    if (!modal || !img) return;

    img.dataset.retried = '';
    const resolved = this.resolveAssetUrl(src);
    img.src = resolved;
    img.alt = caption || 'Lámina técnica náutica';
    img.onerror = () => {
      if (!img.dataset.retried) {
        img.dataset.retried = '1';
        const f = resolved.split('/').pop();
        img.src = `./imagenes/curso/${f}`;
      }
    };
    if (cap) cap.innerHTML = `<strong>Lámina Oficial:</strong> ${caption || 'Esquema de estudio'}`;
    modal.classList.add('open');
  }

  bindNavigationDelegation() {
    const navContainer = document.getElementById('sidebar-modules-nav');
    if (navContainer && !navContainer.dataset.bound) {
      navContainer.dataset.bound = 'true';
      navContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.sidebar-nav-item');
        if (!btn) return;
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;

        this.closeLightbox();
        this.activeFilter = filter;
        this.renderSidebar();
        this.renderMobilePills();
        window.scrollTo({ top: 0, behavior: 'instant' });
        this.renderContent();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }

    const pillsContainer = document.getElementById('mobile-pills-bar');
    if (pillsContainer && !pillsContainer.dataset.bound) {
      pillsContainer.dataset.bound = 'true';
      pillsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.mobile-pill');
        if (!btn) return;
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;

        this.closeLightbox();
        this.activeFilter = filter;
        this.renderSidebar();
        this.renderMobilePills();
        window.scrollTo({ top: 0, behavior: 'instant' });
        this.renderContent();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }
  }

  renderSidebar() {
    const navContainer = document.getElementById('sidebar-modules-nav');
    if (!navContainer) return;

    let html = `
      <button class="sidebar-nav-item ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
        <span class="nav-item-icon">📚</span>
        <span class="nav-item-text">Ver Todo el Manual</span>
      </button>
      <div class="sidebar-nav-divider">MÓDULOS OFICIALES</div>
    `;

    for (const key in COURSE_NOTES) {
      const cat = COURSE_NOTES[key];
      const isExt = cat.moduleNumber === 'ext';
      const isActive = this.activeFilter === key;
      const qm = COURSE_QUIZZES.find(q => q.moduleNumber === cat.moduleNumber);

      let badge = '';
      if (qm) {
        let count = 0;
        let correct = 0;
        qm.questions.forEach(q => {
          if (this.answeredMap[q.id] !== undefined) {
            count++;
            if (this.answeredMap[q.id] === q.correctIndex) correct++;
          }
        });
        if (count === 10) {
          badge = correct >= 7 ? '<span class="nav-pill-badge ok">✓ 10/10</span>' : '<span class="nav-pill-badge warn">⚠️ Repasar</span>';
        } else if (count > 0) {
          badge = `<span class="nav-pill-badge in-progress">${count}/10</span>`;
        }
      }

      html += `
        <button class="sidebar-nav-item ${isActive ? 'active' : ''}" data-filter="${key}">
          <span class="nav-item-icon">${cat.icon}</span>
          <span class="nav-item-text">${cat.title.split('·')[0].trim()}</span>
          ${badge}
        </button>
      `;
    }

    html += `
      <div class="sidebar-nav-divider">EVALUACIONES</div>
      <button class="sidebar-nav-item highlight-exam ${this.activeFilter === 'quiz' ? 'active' : ''}" data-filter="quiz">
        <span class="nav-item-icon">📝</span>
        <span class="nav-item-text">Banco Oficial PNA (60 Q)</span>
        <span class="nav-pill-badge exam-badge" id="sidebar-exam-badge">0/60</span>
      </button>
    `;

    navContainer.innerHTML = html;
  }

  renderMobilePills() {
    const pillsContainer = document.getElementById('mobile-pills-bar');
    if (!pillsContainer) return;

    let html = `
      <button class="mobile-pill ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">📚 Todos</button>
    `;

    for (const key in COURSE_NOTES) {
      const cat = COURSE_NOTES[key];
      const isActive = this.activeFilter === key;
      const shortName = cat.title.includes('·') ? cat.title.split('·')[0].replace('Módulo ', 'Mód ') : cat.title.split(' ')[0];
      html += `
        <button class="mobile-pill ${isActive ? 'active' : ''}" data-filter="${key}">
          ${cat.icon} ${shortName}
        </button>
      `;
    }

    html += `
      <button class="mobile-pill pill-quiz ${this.activeFilter === 'quiz' ? 'active' : ''}" data-filter="quiz">
        📝 Examen (60 Q)
      </button>
    `;

    pillsContainer.innerHTML = html;
  }

  renderContent() {
    this.closeLightbox();
    const mainContainer = document.getElementById('course-main-content');
    if (!mainContainer) return;

    // Check if viewing Quiz exclusively
    if (this.activeFilter === 'quiz') {
      this.renderFullQuizView(mainContainer);
      return;
    }

    let html = '';
    const query = this.searchQuery.trim().toLowerCase();

    for (const key in COURSE_NOTES) {
      if (this.activeFilter !== 'all' && this.activeFilter !== key) continue;

      const cat = COURSE_NOTES[key];
      const filteredSections = cat.sections.filter(s => {
        if (!query) return true;
        return s.heading.toLowerCase().includes(query) || s.content.toLowerCase().includes(query) || cat.title.toLowerCase().includes(query);
      });

      if (filteredSections.length === 0) continue;

      html += `
        <article class="module-card" id="mod-${key}">
          <header class="module-card-header">
            <span class="module-icon-large">${cat.icon}</span>
            <div>
              <div class="module-eyebrow">PROGRAMA OFICIAL TIMONEL VELA Y MOTOR</div>
              <h2>${cat.title}</h2>
            </div>
          </header>

          <div class="module-sections-list">
            ${filteredSections.map((s, idx) => {
              const figs = s.figures || (s.image ? [{ src: s.image, caption: s.caption }] : []);
              return `
                <section class="chapter-card" id="chap-${key}-${idx}">
                  <h3 class="chapter-title">${s.heading}</h3>
                  <div class="chapter-body">
                    ${s.content.split('\n\n').map(p => `<p>${this.highlightText(p, query)}</p>`).join('')}
                  </div>
                  ${figs.length > 0 ? `
                    <div class="chapter-figures-grid">
                      ${figs.map(f => {
                        const resolvedSrc = this.resolveAssetUrl(f.src);
                        return `
                          <figure class="technical-figure" data-lightbox="${f.src}" data-caption="${(f.caption || s.heading).replace(/"/g, '&quot;')}">
                            <div class="figure-img-wrapper">
                              <img src="${resolvedSrc}" alt="${s.heading}" loading="lazy" onerror="if(!this.dataset.retried){this.dataset.retried=1; const fname=this.src.split('/').pop(); this.src='./imagenes/curso/'+fname;}" />
                              <div class="figure-zoom-overlay">
                                <span>🔍 Click para ampliar en alta definición</span>
                              </div>
                            </div>
                            <figcaption class="figure-caption">
                              <strong>Lámina Oficial:</strong> ${f.caption || s.heading}
                            </figcaption>
                          </figure>
                        `;
                      }).join('')}
                    </div>
                  ` : ''}
                </section>
              `;
            }).join('')}
          </div>

          ${cat.moduleNumber !== 'ext' ? this.renderModuleQuizSnippet(cat.moduleNumber) : ''}
        </article>
      `;
    }

    if (!html) {
      html = `
        <div class="no-results-card">
          <div class="no-results-icon">🔍</div>
          <h3>No se encontraron resultados para "${this.searchQuery}"</h3>
          <p>Probá con términos náuticos como <em>ceñida</em>, <em>pampero</em>, <em>duodécimos</em>, <em>iala</em> o <em>luces</em>.</p>
          <button id="btn-clear-search-empty" class="btn-primary-action">Limpiar búsqueda</button>
        </div>
      `;
    }

    mainContainer.innerHTML = html;

    // Attach Lightbox triggers
    mainContainer.querySelectorAll('.technical-figure').forEach(fig => {
      fig.addEventListener('click', () => {
        const src = fig.getAttribute('data-lightbox');
        const cap = fig.getAttribute('data-caption');
        if (src) this.openLightbox(src, cap);
      });
    });

    const clearBtn = document.getElementById('btn-clear-search-empty');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const input = document.getElementById('notes-global-search');
        if (input) input.value = '';
        this.searchQuery = '';
        this.renderContent();
      });
    }

    this.bindQuizOptions(mainContainer);
  }

  highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }

  renderModuleQuizSnippet(modNumber) {
    const qm = COURSE_QUIZZES.find(q => q.moduleNumber === modNumber);
    if (!qm) return '';

    let answeredCount = 0;
    let correctCount = 0;
    qm.questions.forEach(q => {
      if (this.answeredMap[q.id] !== undefined) {
        answeredCount++;
        if (this.answeredMap[q.id] === q.correctIndex) correctCount++;
      }
    });

    const pct = answeredCount > 0 ? Math.round((correctCount / qm.questions.length) * 100) : 0;
    const isApproved = pct >= 70;

    return `
      <div class="module-quiz-box">
        <div class="module-quiz-header">
          <div>
            <div class="quiz-badge">AUTOEVALUACIÓN PNA</div>
            <h4>📝 Test Oficial · Módulo ${qm.moduleNumber}: ${qm.moduleTitle}</h4>
            <p class="quiz-desc">10 preguntas oficiales con justificación técnica inmediata. Aprobación: 70% o superior.</p>
          </div>
          <div class="module-quiz-stats">
            <span class="quiz-score-num">${correctCount}/${qm.questions.length}</span>
            <span class="quiz-score-tag ${isApproved ? 'tag-approved' : 'tag-pending'}">
              ${answeredCount === 10 ? (isApproved ? '✓ APROBADO' : '⚠️ REPASAR') : `${answeredCount}/10 resp.`}
            </span>
            <button class="btn-reset-module-quiz" data-mod="${qm.moduleNumber}" title="Reiniciar este examen">🔄 Reiniciar</button>
          </div>
        </div>

        <div class="module-quiz-questions">
          ${qm.questions.map((q, qIdx) => this.renderQuestionItem(q, qIdx)).join('')}
        </div>
      </div>
    `;
  }

  renderQuestionItem(q, qIdx) {
    const userSel = this.answeredMap[q.id];
    const isAnswered = userSel !== undefined;
    const resolvedFigure = q.figure ? this.resolveAssetUrl(q.figure) : null;

    return `
      <div class="quiz-card-item" id="q-box-${q.id}">
        <div class="quiz-card-prompt">
          <span class="q-num">${qIdx + 1}.</span>
          <span class="q-text">${q.prompt}</span>
        </div>

        ${resolvedFigure ? `
          <div class="quiz-card-figure technical-figure" data-lightbox="${q.figure}" data-caption="Pregunta ${qIdx + 1}: ${q.prompt.replace(/"/g, '&quot;')}">
            <img src="${resolvedFigure}" alt="Figura de examen" loading="lazy" onerror="if(!this.dataset.retried){this.dataset.retried=1; const fname=this.src.split('/').pop(); this.src='./imagenes/curso/'+fname;}" />
            <div class="figure-zoom-overlay"><span>🔍 Click para ampliar</span></div>
          </div>
        ` : ''}

        <div class="quiz-card-options">
          ${q.options.map((opt, optIdx) => {
            let btnClass = 'quiz-opt-btn';
            if (isAnswered) {
              if (optIdx === q.correctIndex) btnClass += ' correct';
              else if (optIdx === userSel) btnClass += ' wrong';
            }
            const disabled = isAnswered ? 'disabled' : '';
            return `
              <button class="${btnClass}" data-qid="${q.id}" data-idx="${optIdx}" ${disabled}>
                <span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                <span class="opt-label">${opt}</span>
              </button>
            `;
          }).join('')}
        </div>

        ${isAnswered ? `
          <div class="quiz-card-expl ${userSel === q.correctIndex ? 'expl-correct' : 'expl-wrong'}">
            ${userSel === q.correctIndex ? '<strong>✓ ¡Correcto!</strong> ' : '<strong>✗ Incorrecto.</strong> '}
            ${q.explanation}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderFullQuizView(container) {
    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;

    COURSE_QUIZZES.forEach(qm => {
      totalQuestions += qm.questions.length;
      qm.questions.forEach(q => {
        if (this.answeredMap[q.id] !== undefined) {
          totalAnswered++;
          if (this.answeredMap[q.id] === q.correctIndex) totalCorrect++;
        }
      });
    });

    const totalPct = totalAnswered > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const isOverallPassed = totalAnswered >= 42 && totalPct >= 70;

    let html = `
      <div class="exam-full-banner">
        <div class="exam-banner-top">
          <div>
            <div class="module-eyebrow">PREFECTURA NAVAL ARGENTINA · BANCO OFICIAL</div>
            <h2>📝 Examen Integral de Autoevaluación (60 Preguntas)</h2>
            <p>Simulación completa del examen teórico oficial para Timonel de Yate Vela y Motor. Se aprueba con el 70% (42 respuestas correctas o más).</p>
          </div>
          <div class="exam-score-box">
            <div class="exam-score-big">${totalCorrect} / ${totalQuestions}</div>
            <div class="exam-score-pct">${totalPct}% Aciertos</div>
            <div class="exam-score-status ${isOverallPassed ? 'stat-ok' : ''}">
              ${totalAnswered === totalQuestions ? (isOverallPassed ? '🏆 EXAMEN APROBADO' : '⚠️ DESAPROBADO') : `${totalAnswered}/${totalQuestions} respondidas`}
            </div>
            <button id="btn-reset-all-exam" class="btn-reset-all-exam">🔄 Reiniciar Todo el Examen</button>
          </div>
        </div>

        <div class="exam-progress-bar-container">
          <div class="exam-progress-bar-fill" style="width: ${(totalAnswered / totalQuestions) * 100}%"></div>
        </div>
      </div>

      <div class="exam-modules-container">
        ${COURSE_QUIZZES.map(qm => {
          let modAns = 0;
          let modCorr = 0;
          qm.questions.forEach(q => {
            if (this.answeredMap[q.id] !== undefined) {
              modAns++;
              if (this.answeredMap[q.id] === q.correctIndex) modCorr++;
            }
          });
          const modPct = modAns > 0 ? Math.round((modCorr / qm.questions.length) * 100) : 0;

          return `
            <div class="exam-module-section">
              <div class="exam-module-header">
                <h3>${qm.icon} Módulo ${qm.moduleNumber}: ${qm.moduleTitle}</h3>
                <div class="exam-mod-summary">
                  <span>${modCorr}/${qm.questions.length} correctas (${modPct}%)</span>
                  <button class="btn-reset-module-quiz" data-mod="${qm.moduleNumber}" title="Reiniciar este módulo">🔄 Reiniciar módulo</button>
                </div>
              </div>
              <div class="module-quiz-questions">
                ${qm.questions.map((q, idx) => this.renderQuestionItem(q, idx)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;

    const resetAllBtn = document.getElementById('btn-reset-all-exam');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas borrar todas las respuestas del examen completo?')) {
          this.answeredMap = {};
          this.saveAnswers();
          this.renderSidebar();
          this.renderFullQuizView(container);
          this.updateGlobalExamBadge();
        }
      });
    }

    container.querySelectorAll('.technical-figure').forEach(fig => {
      fig.addEventListener('click', () => {
        const src = fig.getAttribute('data-lightbox');
        const cap = fig.getAttribute('data-caption');
        if (src) this.openLightbox(src, cap);
      });
    });

    this.bindQuizOptions(container);
  }

  bindQuizOptions(container) {
    container.querySelectorAll('.quiz-opt-btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-qid');
        const optIdx = parseInt(btn.getAttribute('data-idx'), 10);
        this.answeredMap[qid] = optIdx;
        this.saveAnswers();

        this.renderSidebar();
        this.renderContent();
        this.updateGlobalExamBadge();
      });
    });

    container.querySelectorAll('.btn-reset-module-quiz').forEach(btn => {
      btn.addEventListener('click', () => {
        const modId = parseInt(btn.getAttribute('data-mod'), 10);
        const qm = COURSE_QUIZZES.find(q => q.moduleNumber === modId);
        if (!qm) return;
        qm.questions.forEach(q => {
          delete this.answeredMap[q.id];
        });
        this.saveAnswers();
        this.renderSidebar();
        this.renderContent();
        this.updateGlobalExamBadge();
      });
    });
  }

  updateGlobalExamBadge() {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalAnswered = 0;

    COURSE_QUIZZES.forEach(qm => {
      totalQuestions += qm.questions.length;
      qm.questions.forEach(q => {
        if (this.answeredMap[q.id] !== undefined) {
          totalAnswered++;
          if (this.answeredMap[q.id] === q.correctIndex) totalCorrect++;
        }
      });
    });

    const badge = document.getElementById('sidebar-exam-badge');
    if (badge) {
      badge.textContent = `${totalCorrect}/${totalQuestions}`;
    }

    const headerPill = document.getElementById('header-exam-progress');
    if (headerPill) {
      const pct = Math.round((totalCorrect / totalQuestions) * 100);
      headerPill.innerHTML = `📝 Examen: <strong>${totalCorrect}/${totalQuestions}</strong> (${pct}%)`;
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('notes-global-search');
    const searchClear = document.getElementById('notes-search-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        if (searchClear) searchClear.style.display = this.searchQuery ? 'block' : 'none';
        this.renderContent();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        searchClear.style.display = 'none';
        this.renderContent();
        searchInput.focus();
      });
    }
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.courseApp = new CoursePage();
});
