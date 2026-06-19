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

  // Local storage for current annotation results
  let currentResults = null;

  // Simple dictionary of common medical terms mapped to categories
  const entityDict = [
    { token: 'nyeri perut', label: 'GEJALA', normalized: 'nyeri perut' },
    { token: 'mual', label: 'GEJALA', normalized: 'mual' },
    { token: 'demam', label: 'GEJALA', normalized: 'demam' },
    { token: 'pusing', label: 'GEJALA', normalized: 'pusing' },
    { token: 'batuk', label: 'GEJALA', normalized: 'batuk' },
    { token: 'sesak napas', label: 'GEJALA', normalized: 'sesak napas' },
    { token: 'gatal', label: 'GEJALA', normalized: 'gatal' },
    { token: 'nyeri', label: 'GEJALA', normalized: 'nyeri' },
    
    { token: 'paracetamol', label: 'OBAT', normalized: 'paracetamol' },
    { token: 'ibuprofen', label: 'OBAT', normalized: 'ibuprofen' },
    { token: 'biotin', label: 'OBAT', normalized: 'biotin' },
    { token: 'amlodipin', label: 'OBAT', normalized: 'amlodipin' },
    { token: 'amoxicillin', label: 'OBAT', normalized: 'amoxicillin' },
    { token: 'antimo', label: 'OBAT', normalized: 'antimo' },
    
    { token: 'perut', label: 'LOKASI', normalized: 'perut' },
    { token: 'kepala', label: 'LOKASI', normalized: 'kepala' },
    { token: 'dada', label: 'LOKASI', normalized: 'dada' },
    { token: 'tangan', label: 'LOKASI', normalized: 'tangan' },
    { token: 'kaki', label: 'LOKASI', normalized: 'kaki' },
    { token: 'kulit', label: 'LOKASI', normalized: 'kulit' },
    
    { token: 'diabetes', label: 'PENYAKIT', normalized: 'diabetes' },
    { token: 'hipertensi', label: 'PENYAKIT', normalized: 'hipertensi' },
    { token: 'maag', label: 'PENYAKIT', normalized: 'maag' },
    { token: 'ketombe', label: 'PENYAKIT', normalized: 'ketombe' },
    { token: 'asma', label: 'PENYAKIT', normalized: 'asma' },
    { token: 'flu', label: 'PENYAKIT', normalized: 'flu' },
    
    { token: 'operasi', label: 'TINDAKAN', normalized: 'operasi' },
    { token: 'biopsi', label: 'TINDAKAN', normalized: 'biopsi' },
    { token: 'vaksin', label: 'TINDAKAN', normalized: 'vaksin' },
    { token: 'kemoterapi', label: 'TINDAKAN', normalized: 'kemoterapi' },
    { token: 'terapi', label: 'TINDAKAN', normalized: 'terapi' },
    { token: 'rawat inap', label: 'TINDAKAN', normalized: 'rawat inap' }
  ];

  // Helper: Show toast notification
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Core parsing and highlighting logic
  function performAnalysis(text) {
    if (!text.trim()) {
      // If empty, fall back to the reference text
      text = "Saya mengalami nyeri perut dan mual selama beberapa hari, serta sudah minum paracetamol.";
      inputText.value = text;
    }

    // Sort dictionary by token length descending to match longer phrases first
    const sortedDict = [...entityDict].sort((a, b) => b.token.length - a.token.length);

    // Extract matches
    const annotations = [];
    const lowerText = text.toLowerCase();

    // Track matched ranges to prevent overlapping matches
    const matchedRanges = [];

    for (const item of sortedDict) {
      let startIndex = 0;
      while ((startIndex = lowerText.indexOf(item.normalized, startIndex)) !== -1) {
        const endIndex = startIndex + item.token.length;
        
        const overlaps = matchedRanges.some(range => 
          (startIndex >= range.start && startIndex < range.end) || 
          (endIndex > range.start && endIndex <= range.end) ||
          (startIndex <= range.start && endIndex >= range.end)
        );

        if (!overlaps) {
          const originalToken = text.substring(startIndex, endIndex);
          annotations.push({
            token: originalToken,
            label: item.label,
            start: startIndex,
            end: endIndex
          });
          matchedRanges.push({ start: startIndex, end: endIndex });
        }
        
        startIndex += item.token.length;
      }
    }

    // Sort annotations by starting index
    annotations.sort((a, b) => a.start - b.start);

    // Build Highlighted HTML
    let htmlContent = '';
    let lastIdx = 0;

    annotations.forEach(ann => {
      // Add preceding plain text
      htmlContent += escapeHTML(text.substring(lastIdx, ann.start));
      
      // Add marked entity HTML
      const labelClass = `entity-${ann.label.toLowerCase()}`;
      htmlContent += `<mark class="entity-mark ${labelClass}">` +
                     `${escapeHTML(ann.token)}` +
                     `<span class="entity-badge">${ann.label}</span>` +
                     `</mark>`;
      
      lastIdx = ann.end;
    });
    
    htmlContent += escapeHTML(text.substring(lastIdx));
    highlightDisplay.innerHTML = htmlContent;

    // Categorize extracted tokens
    const categorized = {
      GEJALA: [],
      LOKASI: [],
      PENYAKIT: [],
      OBAT: [],
      TINDAKAN: []
    };

    annotations.forEach(ann => {
      if (categorized[ann.label]) {
        if (!categorized[ann.label].includes(ann.token)) {
          categorized[ann.label].push(ann.token);
        }
      }
    });

    // Helper to update table cell values and confidence
    function updateTableCell(cellEl, confEl, valuesList, mockConfValue) {
      if (valuesList.length > 0) {
        cellEl.textContent = valuesList.join(', ');
        cellEl.classList.remove('entity-empty');
        confEl.textContent = mockConfValue;
        confEl.classList.add('active-val');
      } else {
        cellEl.textContent = '-';
        cellEl.classList.add('entity-empty');
        confEl.textContent = '-';
        confEl.classList.remove('active-val');
      }
    }

    // Populate UI table cells with simulated confidence scores
    updateTableCell(resGejala, confGejala, categorized.GEJALA, '98.2%');
    updateTableCell(resLokasi, confLokasi, categorized.LOKASI, '95.5%');
    updateTableCell(resPenyakit, confPenyakit, categorized.PENYAKIT, '94.0%');
    updateTableCell(resObat, confObat, categorized.OBAT, '99.1%');
    updateTableCell(resTindakan, confTindakan, categorized.TINDAKAN, '89.0%');

    // Store final JSON output structure
    currentResults = {
      text: text,
      annotations: annotations.map(ann => ({
        token: ann.token,
        label: ann.label
      }))
    };

    // Swap empty state with filled state on the left
    highlightEmptyState.style.display = 'none';
    highlightFilledState.style.display = 'flex';

    // Activate reset button
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

    // Reset Table Elements to "Belum ada data" / "-"
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

  // Event Listeners
  btnAnalyze.addEventListener('click', () => {
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

    setTimeout(() => {
      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = originalContent;
      performAnalysis(inputText.value);
    }, 450); // Natural quick loading state
  });

  btnReset.addEventListener('click', resetUI);
  linkAnalyzeAnother.addEventListener('click', (e) => {
    e.preventDefault();
    resetUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Copy JSON to Clipboard
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

  // Download JSON file
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
});
