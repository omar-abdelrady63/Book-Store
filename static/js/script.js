

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'library_theme';
  const SOUND_STORAGE_KEY = 'library_sound';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    applyTheme(savedTheme, false);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        playHapticFeedback('light');
        const current = document.documentElement.getAttribute('data-theme') || 'system';
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, true);
      });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const current = localStorage.getItem(THEME_STORAGE_KEY);
      if (!current || current === 'system') {
        applyTheme('system', false);
      }
    });
  }

  function applyTheme(theme, save = true) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (save) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const moonIcon = document.getElementById('theme-moon-icon');
    const sunIcon = document.getElementById('theme-sun-icon');
    if (moonIcon && sunIcon) {
      moonIcon.style.display = isDark ? 'none' : 'block';
      sunIcon.style.display = isDark ? 'block' : 'none';
    }
  }

  let audioCtx = null;
  let isSoundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';

  function initAudioHaptics() {
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
      updateSoundIcon(isSoundEnabled);
      soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem(SOUND_STORAGE_KEY, isSoundEnabled ? 'true' : 'false');
        updateSoundIcon(isSoundEnabled);
        if (isSoundEnabled) {
          playHapticFeedback('confirm');
          showToast('Sound feedback enabled');
        } else {
          showToast('Sound feedback muted');
        }
      });
    }

    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.btn, .icon-btn, .nav-cart-btn, .segment-item, .stepper-btn');
      if (btn) {
        playHapticFeedback('light');
      }
    });
  }

  function updateSoundIcon(enabled) {
    const soundOn = document.getElementById('sound-on-icon');
    const soundOff = document.getElementById('sound-off-icon');
    if (soundOn && soundOff) {
      soundOn.style.display = enabled ? 'block' : 'none';
      soundOff.style.display = enabled ? 'none' : 'block';
    }
  }

  function playHapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(8);
        else if (type === 'confirm') navigator.vibrate([10, 30, 15]);
      } catch (err) {}
    }

    if (!isSoundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      if (type === 'light') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.015);
      } else if (type === 'confirm') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {}
  }

  function initSegmentedControl() {
    const container = document.querySelector('.segmented-control');
    if (!container) return;

    let glider = container.querySelector('.segmented-glider');
    if (!glider) {
      glider = document.createElement('div');
      glider.className = 'segmented-glider';
      container.prepend(glider);
    }

    function positionGlider(activeItem) {
      if (!activeItem) return;
      const rect = activeItem.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      const offsetLeft = rect.left - parentRect.left;
      glider.style.width = `${rect.width}px`;
      glider.style.transform = `translateX(${offsetLeft}px)`;
    }

    const activeItem = container.querySelector('.segment-item.active') || container.querySelector('.segment-item');
    if (activeItem) {
      requestAnimationFrame(() => positionGlider(activeItem));
      window.addEventListener('resize', () => {
        const currentActive = container.querySelector('.segment-item.active');
        positionGlider(currentActive);
      });
    }
  }

  function initSpotlightSearch() {
    const searchInput = document.getElementById('spotlight-search-input');
    const clearBtn = document.getElementById('spotlight-clear-btn');
    if (!searchInput) return;

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
        playHapticFeedback('light');
      }
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });

    function updateClearVisibility() {
      if (clearBtn) {
        clearBtn.style.display = searchInput.value.trim().length > 0 ? 'inline-flex' : 'none';
      }
    }

    searchInput.addEventListener('input', () => {
      updateClearVisibility();
      filterBooksLive(searchInput.value.trim().toLowerCase());
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        updateClearVisibility();
        filterBooksLive('');
        searchInput.focus();
        playHapticFeedback('light');
      });
    }

    updateClearVisibility();
  }

  function filterBooksLive(query) {
    const bookCards = document.querySelectorAll('.book-card-container');
    if (!bookCards.length) return;

    let matchCount = 0;
    bookCards.forEach((cardContainer) => {
      const title = cardContainer.dataset.title || '';
      const author = cardContainer.dataset.author || '';
      const category = cardContainer.dataset.category || '';

      const matches = !query || 
                      title.toLowerCase().includes(query) || 
                      author.toLowerCase().includes(query) ||
                      category.toLowerCase().includes(query);

      if (matches) {
        cardContainer.style.display = '';
        matchCount++;
      } else {
        cardContainer.style.display = 'none';
      }
    });

    let liveEmpty = document.getElementById('live-filter-empty');
    if (matchCount === 0 && query) {
      if (!liveEmpty) {
        liveEmpty = document.createElement('div');
        liveEmpty.id = 'live-filter-empty';
        liveEmpty.className = 'empty-state';
        liveEmpty.innerHTML = `
          <div class="empty-state__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 class="empty-state__title">No Matches Found</h3>
          <p class="empty-state__text">No books match "${query}". Try searching for another title or author.</p>
        `;
        const grid = document.querySelector('.books-grid');
        if (grid && grid.parentNode) {
          grid.parentNode.insertBefore(liveEmpty, grid.nextSibling);
        }
      }
      liveEmpty.style.display = 'flex';
    } else if (liveEmpty) {
      liveEmpty.style.display = 'none';
    }
  }

  function initCartSteppers() {
    const stepperGroups = document.querySelectorAll('.cart-stepper-group');
    stepperGroups.forEach((group) => {
      const minusBtn = group.querySelector('.stepper-btn--minus');
      const plusBtn = group.querySelector('.stepper-btn--plus');
      const input = group.querySelector('.stepper-input');
      const form = group.closest('form');
      const maxStock = parseInt(input.getAttribute('max') || '9999', 10);
      const minVal = parseInt(input.getAttribute('min') || '1', 10);

      let submitTimer = null;

      function scheduleSubmit() {
        playHapticFeedback('confirm');
        if (submitTimer) clearTimeout(submitTimer);
        submitTimer = setTimeout(() => {
          if (form) form.submit();
        }, 400); // Debounce to allow multiple quick clicks smoothly
      }

      function updateItemDisplay(newVal) {
        input.value = newVal;
        // Optimistic subtotal calculation
        const card = group.closest('.cart-item-card');
        if (card) {
          const unitPrice = parseFloat(card.dataset.unitPrice || '0');
          const subtotalEl = card.querySelector('.cart-item-subtotal');
          if (subtotalEl) {
            subtotalEl.textContent = '$' + (unitPrice * newVal).toFixed(2);
          }
        }
        updateGrandTotal();
      }

      function updateGrandTotal() {
        let total = 0;
        let totalItems = 0;
        document.querySelectorAll('.cart-item-card').forEach((c) => {
          const price = parseFloat(c.dataset.unitPrice || '0');
          const qInput = c.querySelector('.stepper-input');
          const q = parseInt(qInput ? qInput.value : '1', 10) || 1;
          total += price * q;
          totalItems += q;
        });

        const totalRowVal = document.querySelector('.summary-row--total .summary-val');
        if (totalRowVal) {
          totalRowVal.textContent = '$' + total.toFixed(2);
        }
        const subtotalRowVal = document.querySelector('.summary-row .summary-val');
        if (subtotalRowVal) {
          subtotalRowVal.textContent = '$' + total.toFixed(2);
        }

        // Update nav badge count if present
        const badge = document.querySelector('.nav-cart-btn__badge');
        if (badge) {
          badge.textContent = totalItems;
        }
      }

      if (minusBtn && input) {
        minusBtn.addEventListener('click', (e) => {
          e.preventDefault();
          let current = parseInt(input.value || '1', 10);
          if (current > minVal) {
            updateItemDisplay(current - 1);
            scheduleSubmit();
          } else {
            playHapticFeedback('light');
          }
        });
      }

      if (plusBtn && input) {
        plusBtn.addEventListener('click', (e) => {
          e.preventDefault();
          let current = parseInt(input.value || '1', 10);
          if (current < maxStock) {
            updateItemDisplay(current + 1);
            scheduleSubmit();
          } else {
            showToast(`Maximum stock reached (${maxStock})`);
            playHapticFeedback('light');
          }
        });
      }

      if (input) {
        input.addEventListener('change', () => {
          let val = parseInt(input.value || '1', 10);
          if (isNaN(val) || val < minVal) val = minVal;
          if (val > maxStock) {
            val = maxStock;
            showToast(`Capped to available stock (${maxStock})`);
          }
          updateItemDisplay(val);
          scheduleSubmit();
        });
      }
    });
  }

  // ==========================================================================
  // 6. Password Visibility Toggle
  // ==========================================================================
  function initPasswordToggles() {
    const toggles = document.querySelectorAll('.js-password-toggle');
    toggles.forEach((btn) => {
      btn.addEventListener('click', () => {
        playHapticFeedback('light');
        const input = btn.closest('.input-wrapper').querySelector('input');
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        // Toggle icon visual
        const eyeOpen = btn.querySelector('.icon-eye-open');
        const eyeClosed = btn.querySelector('.icon-eye-closed');
        if (eyeOpen && eyeClosed) {
          eyeOpen.style.display = isPassword ? 'none' : 'block';
          eyeClosed.style.display = isPassword ? 'block' : 'none';
        }
      });
    });
  }

  // ==========================================================================
  // 7. Toast Notification Utility
  // ==========================================================================
  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Expose toast to global scope for templates
  window.AppToast = showToast;
  window.showToast = showToast;

  // ==========================================================================
  // 8. Lifecycle Boot
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAudioHaptics();
    initSegmentedControl();
    initSpotlightSearch();
    initCartSteppers();
    initPasswordToggles();
  });
})();
