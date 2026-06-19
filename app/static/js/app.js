document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputText = document.getElementById('input-text');
  const btnAnalyze = document.getElementById('btn-analyze');
  const resultsPanel = document.getElementById('results-panel');
  const highlightEmptyState = document.getElementById('highlight-empty-state');
  const highlightFilledState = document.getElementById('highlight-filled-state');
  const highlightDisplay = document.getElementById('highlight-display');
  const btnCopyJson = document.getElementById('btn-copy-json');
  const btnDownload = document.getElementById('btn-download');
  const btnReset = document.getElementById('btn-reset');
  const linkAnalyzeAnother = document.getElementById('link-analyze-another');
  const toast = document.getElementById('toast');

  // Table Result & Confidence Elements
  const resGejala = document.getElementById('res-gejala');
  const confGejala = document.getElementById('conf-gejala');
  
  const resLokasi = document.getElementById('res-lokasi');
  const confLokasi = document.getElementById('conf-lokasi');
  
  const resPenyakit = document.getElementById('res-penyakit');
  const confPenyakit = document.getElementById('conf-penyakit');
  
  const resObat = document.getElementById('res-obat');
  const confObat = document.getElementById('conf-obat');
  
  const resTindakan = document.getElementById('res-tindakan');
  const confTindakan = document.getElementById('conf-tindakan');

  // Local storage for current API prediction results
  let currentResults = null;

  // Helper: Show toast notification
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Core render function using actual API response offsets
  function renderPrediction(text, entities) {
    // Sort entities by starting index to prevent overlap formatting issues
    entities.sort((a, b) => a.start - b.start);

    // Build Highlighted HTML by slicing original text
    let htmlContent = '';
    let lastIdx = 0;

    entities.forEach(ann => {
      // Prevent overlaps and indices out of bounds
      if (ann.start >= lastIdx && ann.end <= text.length) {
        // Add preceding text
        htmlContent += escapeHTML(text.substring(lastIdx, ann.start));
        
        // Add highlighted word span
        const labelClass = `entity-${ann.label.toLowerCase()}`;
        htmlContent += `<mark class="entity-mark ${labelClass}">` +
                       `${escapeHTML(ann.text)}` +
                       `<span class="entity-badge">${ann.label}</span>` +
                       `</mark>`;
        lastIdx = ann.end;
      }
    });
    
    htmlContent += escapeHTML(text.substring(lastIdx));
    highlightDisplay.innerHTML = htmlContent;

    // Group predictions for table
    const categorized = {
      GEJALA: [],
      LOKASI: [],
      PENYAKIT: [],
      OBAT: [],
      TINDAKAN: []
    };
    
    const scores = {
      GEJALA: [],
      LOKASI: [],
      PENYAKIT: [],
      OBAT: [],
      TINDAKAN: []
    };

    entities.forEach(ann => {
      const labelUpper = ann.label.toUpperCase();
      if (categorized[labelUpper]) {
        // Avoid duplicate words in the cell representation
        if (!categorized[labelUpper].includes(ann.text)) {
          categorized[labelUpper].push(ann.text);
        }
        scores[labelUpper].push(ann.score);
      }
    });

    // Helper to calculate confidence average score
    function getAverageScore(scoreList) {
      if (scoreList.length === 0) return '-';
      const avg = scoreList.reduce((a, b) => a + b, 0) / scoreList.length;
      return `${(avg * 100).toFixed(1)}%`;
    }

    // Helper to update table row content
    function updateTableCell(cellEl, confEl, valuesList, scoreList) {
      if (valuesList.length > 0) {
        cellEl.textContent = valuesList.join(', ');
        cellEl.classList.remove('entity-empty');
        confEl.textContent = getAverageScore(scoreList);
        confEl.classList.add('active-val');
      } else {
        cellEl.textContent = '-';
        cellEl.classList.add('entity-empty');
        confEl.textContent = '-';
        confEl.classList.remove('active-val');
      }
    }

    // Populate UI table cells
    updateTableCell(resGejala, confGejala, categorized.GEJALA, scores.GEJALA);
    updateTableCell(resLokasi, confLokasi, categorized.LOKASI, scores.LOKASI);
    updateTableCell(resPenyakit, confPenyakit, categorized.PENYAKIT, scores.PENYAKIT);
    updateTableCell(resObat, confObat, categorized.OBAT, scores.OBAT);
    updateTableCell(resTindakan, confTindakan, categorized.TINDAKAN, scores.TINDAKAN);

    // Save payload for clipboard copy and download
    currentResults = {
      text: text,
      entities: entities
    };

    // Swap empty state with filled state
    highlightEmptyState.style.display = 'none';
    highlightFilledState.style.display = 'flex';

    // Activate reset button style
    btnReset.className = 'btn btn-secondary btn-pill';

    // Scroll results panel into view on mobile
    if (window.innerWidth <= 992) {
      resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Helper to escape HTML tags
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Reset the application UI state back to the default empty state
  function resetUI() {
    inputText.value = '';
    highlightEmptyState.style.display = 'flex';
    highlightFilledState.style.display = 'none';
    highlightDisplay.innerHTML = '';
    currentResults = null;

    // Reset Table Elements
    const cells = [resGejala, resLokasi, resPenyakit, resObat, resTindakan];
    const confs = [confGejala, confLokasi, confPenyakit, confObat, confTindakan];
    
    cells.forEach(cell => {
      cell.textContent = 'Belum ada data';
      cell.classList.add('entity-empty');
    });

    confs.forEach(conf => {
      conf.textContent = '-';
      conf.classList.remove('active-val');
    });

    // Disable reset button
    btnReset.className = 'btn btn-disabled-style btn-pill';
    
    inputText.focus();
  }

  // POST Request to predict entities via API
  function analyzeText(text) {
    const originalContent = btnAnalyze.innerHTML;
    btnAnalyze.disabled = true;
    btnAnalyze.innerHTML = `
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:18px; height:18px; animation: spin 1.5s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
      <span>Menganalisis...</span>
    `;

    // Inject spin keyframes if not defined
    if (!document.getElementById('spin-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spin-keyframes';
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    const apiHost = window.location.port === '8000' ? '' : 'http://127.0.0.1:8000';
    fetch(`${apiHost}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API Request Failed');
      }
      return response.json();
    })
    .then(data => {
      renderPrediction(data.text, data.entities);
    })
    .catch(err => {
      console.error(err);
      showToast('Gagal memproses data keluhan medis.');
    })
    .finally(() => {
      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = originalContent;
    });
  }

  // Event Listeners (with null-checks to prevent halts if some elements are absent)
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', () => {
      let text = inputText ? inputText.value.trim() : "";
      if (!text) {
        text = "Saya mengalami nyeri perut dan mual selama beberapa hari, serta sudah minum paracetamol.";
        if (inputText) inputText.value = text;
      }
      analyzeText(text);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', resetUI);
  }

  if (linkAnalyzeAnother) {
    linkAnalyzeAnother.addEventListener('click', (e) => {
      e.preventDefault();
      resetUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Copy JSON to Clipboard
  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', () => {
      if (!currentResults) return;
      
      const jsonString = JSON.stringify(currentResults, null, 2);
      navigator.clipboard.writeText(jsonString)
        .then(() => {
          showToast('JSON berhasil disalin ke clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          showToast('Gagal menyalin JSON.');
        });
    });
  }

  // Download JSON file
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!currentResults) return;

      const jsonString = JSON.stringify(currentResults, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ner_result.json';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    });
  }

  // Settings Drawer Toggle Logic
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerPanel = document.getElementById('drawer-panel');

  function openDrawer() {
    drawerBackdrop.classList.add('show');
    drawerPanel.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  function closeDrawer() {
    drawerBackdrop.classList.remove('show');
    drawerPanel.classList.remove('open');
    document.body.style.overflow = ''; // Restore body scroll
  }

  console.log("Settings drawer initialized. Checking elements:", {
    btnSettings: !!btnSettings,
    btnCloseDrawer: !!btnCloseDrawer,
    drawerBackdrop: !!drawerBackdrop,
    drawerPanel: !!drawerPanel
  });

  if (btnCloseDrawer && drawerBackdrop && drawerPanel) {
    if (btnSettings) {
      btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Settings icon clicked, opening drawer");
        openDrawer();
      });
    }

    btnCloseDrawer.addEventListener('click', (e) => {
      e.preventDefault();
      if (drawerPanel.classList.contains('open')) {
        console.log("Button clicked, closing drawer");
        closeDrawer();
      } else {
        console.log("Button clicked, opening drawer");
        openDrawer();
      }
    });

    drawerBackdrop.addEventListener('click', () => {
      console.log("Backdrop clicked, closing drawer");
      closeDrawer();
    });

    // Escape key press closes drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log("Escape pressed, closing drawer");
        closeDrawer();
      }
    });
  } else {
    console.warn("Required drawer elements (close button, backdrop, panel) are missing on the DOM.");
  }
});
