/**
 * Thai Modern & Contemporary Art Education Web Application
 * CMS Engine & Interactive Behaviors
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'thai_art_education_cms_v5';
  let isEditMode = false;
  let currentTargetImageId = null;
  let originalDefaultState = {};

  // DOM Elements
  const btnToggleEdit = document.getElementById('btnToggleEdit');
  const btnSaveData = document.getElementById('btnSaveData');
  const btnExportData = document.getElementById('btnExportData');
  const btnImportData = document.getElementById('btnImportData');
  const btnResetData = document.getElementById('btnResetData');
  const fileImportInput = document.getElementById('fileImportInput');
  const cmsStatusDot = document.getElementById('cmsStatusDot');
  const cmsStatusText = document.getElementById('cmsStatusText');
  const vintageToast = document.getElementById('vintageToast');

  // Modal Elements
  const imageModal = document.getElementById('imageModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalApplyBtn = document.getElementById('modalApplyBtn');
  const modalRestoreBtn = document.getElementById('modalRestoreBtn');
  const modalTargetName = document.getElementById('modalTargetName');
  const modalImageUrlInput = document.getElementById('modalImageUrlInput');
  const modalFileInput = document.getElementById('modalFileInput');
  const modalPreviewImg = document.getElementById('modalPreviewImg');
  const fileDropzone = document.getElementById('fileDropzone');

  // Capture original initial state for reset capability
  captureDefaultState();

  // Load any previously saved state from LocalStorage
  loadSavedState();

  // Initialize interactive tabs and timeline
  initTabs();

  // Initialize audio ambiance toggle
  initAmbientAudio();

  // Hidden admin tools check (?admin=1 or ?edit=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === '1' || urlParams.get('edit') === '1') {
    document.body.classList.add('cms-admin-active');
  }

  // Secret keyboard shortcut to toggle admin tools: Ctrl+Shift+E or Cmd+Shift+E
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      document.body.classList.toggle('cms-admin-active');
      if (document.body.classList.contains('cms-admin-active')) {
        showToast('เปิดการแสดงเครื่องมือผู้ดูแลระบบ (Admin CMS)');
      } else {
        showToast('ซ่อนเครื่องมือผู้ดูแลระบบแล้ว');
      }
    }
  });

  // Setup Edit Mode Toggle
  if (btnToggleEdit) {
    btnToggleEdit.addEventListener('click', toggleEditMode);
  }

  // Save changes button
  if (btnSaveData) {
    btnSaveData.addEventListener('click', () => {
      saveStateToLocalStorage();
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว! (Saved)');
    });
  }

  // Export JSON
  if (btnExportData) {
    btnExportData.addEventListener('click', exportStateAsJson);
  }

  // Import JSON
  if (btnImportData && fileImportInput) {
    btnImportData.addEventListener('click', () => fileImportInput.click());
    fileImportInput.addEventListener('change', handleImportFile);
  }

  // Reset to original
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นจากเอกสารหรือไม่?')) {
        localStorage.removeItem(STORAGE_KEY);
        restoreDefaultState();
        showToast('รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นแล้ว');
      }
    });
  }

  // Setup Image Edit Badges click handlers
  document.querySelectorAll('.image-edit-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = badge.getAttribute('data-target-img');
      const targetLabel = badge.getAttribute('data-label') || 'รูปภาพ';
      openImageModal(targetId, targetLabel);
    });
  });

  // Modal event listeners
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeImageModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeImageModal);
  if (modalApplyBtn) modalApplyBtn.addEventListener('click', applyImageModalChanges);
  if (modalRestoreBtn) modalRestoreBtn.addEventListener('click', restoreDefaultImageForTarget);

  if (fileDropzone && modalFileInput) {
    fileDropzone.addEventListener('click', () => modalFileInput.click());
    modalFileInput.addEventListener('change', handleModalFileUpload);
  }

  if (modalImageUrlInput) {
    modalImageUrlInput.addEventListener('input', () => {
      const url = modalImageUrlInput.value.trim();
      if (url) {
        modalPreviewImg.src = url;
      }
    });
  }

  // Close modal when clicking outside
  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeImageModal();
    });
  }

  /* -----------------------------------------------------------
     EDIT MODE LOGIC
     ----------------------------------------------------------- */
  function toggleEditMode() {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode-active', isEditMode);

    const editableElements = document.querySelectorAll('[data-editable="true"]');
    editableElements.forEach(el => {
      el.setAttribute('contenteditable', isEditMode ? 'true' : 'false');
      if (isEditMode) {
        el.setAttribute('spellcheck', 'false');
      }
    });

    if (isEditMode) {
      btnToggleEdit.classList.add('active');
      btnToggleEdit.innerHTML = '<svg class="cms-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>โหมดชมเว็บ</span>';
      cmsStatusDot.classList.add('active');
      cmsStatusText.textContent = 'โหมดแก้ไขเปิดอยู่';
      showToast('เปิดโหมดแก้ไขแล้ว : คลิกที่ข้อความเพื่อพิมพ์แก้ไข หรือกดปุ่มเปลี่ยนรูปภาพ');
    } else {
      btnToggleEdit.classList.remove('active');
      btnToggleEdit.innerHTML = '<svg class="cms-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> <span>โหมดแก้ไข</span>';
      cmsStatusDot.classList.remove('active');
      cmsStatusText.textContent = 'โหมดการรับชม';
      saveStateToLocalStorage();
      showToast('ปิดโหมดแก้ไขและบันทึกข้อมูลแล้ว');
    }
  }

  /* -----------------------------------------------------------
     STATE MANAGEMENT & LOCAL STORAGE
     ----------------------------------------------------------- */
  function captureDefaultState() {
    const textData = {};
    document.querySelectorAll('[data-editable-id]').forEach(el => {
      textData[el.getAttribute('data-editable-id')] = el.innerHTML;
    });

    const imageData = {};
    document.querySelectorAll('[data-img-id]').forEach(img => {
      imageData[img.getAttribute('data-img-id')] = img.getAttribute('src');
    });

    originalDefaultState = { textData, imageData };
  }

  function getCurrentState() {
    const textData = {};
    document.querySelectorAll('[data-editable-id]').forEach(el => {
      textData[el.getAttribute('data-editable-id')] = el.innerHTML;
    });

    const imageData = {};
    document.querySelectorAll('[data-img-id]').forEach(img => {
      imageData[img.getAttribute('data-img-id')] = img.getAttribute('src');
    });

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      textData,
      imageData
    };
  }

  function saveStateToLocalStorage() {
    try {
      const state = getCurrentState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save error (likely quota exceeded due to large base64 image):', e);
      showToast('คำเตือน : ข้อมูลมีขนาดใหญ่ แนะนำให้กด Export JSON สำรองไว้');
    }
  }

  function loadSavedState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Migrate image data only from previous versions so user's cropped photos are preserved
        // but text content takes the latest fixed HTML
        const prevKeys = ['thai_art_education_cms_v4', 'thai_art_education_cms_v3'];
        for (const pk of prevKeys) {
          const oldRaw = localStorage.getItem(pk);
          if (oldRaw) {
            try {
              const oldState = JSON.parse(oldRaw);
              if (oldState.imageData) {
                const migrated = {
                  timestamp: new Date().toISOString(),
                  textData: {},
                  imageData: oldState.imageData
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                raw = JSON.stringify(migrated);
                break;
              }
            } catch (err) {}
          }
        }
      }
      if (!raw) return;
      const state = JSON.parse(raw);
      applyStateToDOM(state);
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }

  function applyStateToDOM(state) {
    if (state.textData) {
      Object.entries(state.textData).forEach(([id, html]) => {
        const el = document.querySelector(`[data-editable-id="${id}"]`);
        if (el) {
          // Enforce 1 space before and after colon in loaded text
          const formattedHtml = html.replace(/(?<!https)(?<!http)(?<!data)(?<!style)(?<![0-9])\s*:\s*/g, ' : ');
          el.innerHTML = formattedHtml;
        }
      });
    }

    if (state.imageData) {
      Object.entries(state.imageData).forEach(([id, src]) => {
        const img = document.querySelector(`[data-img-id="${id}"]`);
        if (img) img.src = src;
      });
    }
  }

  function restoreDefaultState() {
    applyStateToDOM(originalDefaultState);
  }

  function exportStateAsJson() {
    const state = getCurrentState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `thai_art_education_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
  }

  function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result);
        applyStateToDOM(state);
        saveStateToLocalStorage();
        showToast('นำเข้าข้อมูลสำเร็จและบันทึกแล้ว');
      } catch (err) {
        alert('ไฟล์ JSON ไม่ถูกต้อง กรุณาตรวจสอบไฟล์');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /* -----------------------------------------------------------
     IMAGE CROP & POSITION ENGINE (เครื่องมือครอบตัดรูปภาพ 1:1)
     ----------------------------------------------------------- */
  const cropViewport = document.getElementById('cropViewport');
  const cropZoomSlider = document.getElementById('cropZoomSlider');
  const cropZoomVal = document.getElementById('cropZoomVal');
  const cropBtnTop = document.getElementById('cropBtnTop');
  const cropBtnCenter = document.getElementById('cropBtnCenter');
  const cropBtnBottom = document.getElementById('cropBtnBottom');
  const cropBtnReset = document.getElementById('cropBtnReset');

  let cropState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    baseScale: 1,
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  };

  function updateCropTransform() {
    if (!modalPreviewImg) return;
    modalPreviewImg.style.transform = `translate(calc(-50% + ${cropState.offsetX}px), calc(-50% + ${cropState.offsetY}px)) scale(${cropState.scale})`;
  }

  function resetCropState() {
    cropState.scale = 1;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    if (cropZoomSlider) cropZoomSlider.value = '1';
    if (cropZoomVal) cropZoomVal.textContent = '1.0x';
    calculateBaseScale();
    updateCropTransform();
  }

  function calculateBaseScale() {
    if (!modalPreviewImg || !modalPreviewImg.naturalWidth) return;
    const viewSize = 250;
    const nw = modalPreviewImg.naturalWidth;
    const nh = modalPreviewImg.naturalHeight;
    cropState.baseScale = Math.max(viewSize / nw, viewSize / nh);
    modalPreviewImg.style.width = (nw * cropState.baseScale) + 'px';
    modalPreviewImg.style.height = (nh * cropState.baseScale) + 'px';
  }

  if (modalPreviewImg) {
    modalPreviewImg.addEventListener('load', () => {
      calculateBaseScale();
      updateCropTransform();
    });
  }

  if (cropZoomSlider) {
    cropZoomSlider.addEventListener('input', () => {
      cropState.scale = parseFloat(cropZoomSlider.value);
      if (cropZoomVal) cropZoomVal.textContent = cropState.scale.toFixed(1) + 'x';
      updateCropTransform();
    });
  }

  if (cropViewport) {
    const startDrag = (clientX, clientY) => {
      cropState.isDragging = true;
      cropState.startX = clientX;
      cropState.startY = clientY;
      cropState.startOffsetX = cropState.offsetX;
      cropState.startOffsetY = cropState.offsetY;
      cropViewport.classList.add('is-dragging');
    };

    const doDrag = (clientX, clientY) => {
      if (!cropState.isDragging) return;
      cropState.offsetX = cropState.startOffsetX + (clientX - cropState.startX);
      cropState.offsetY = cropState.startOffsetY + (clientY - cropState.startY);
      updateCropTransform();
    };

    const endDrag = () => {
      cropState.isDragging = false;
      cropViewport.classList.remove('is-dragging');
    };

    cropViewport.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    cropViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (cropState.isDragging && e.touches.length === 1) doDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', endDrag);
  }

  if (cropBtnTop) {
    cropBtnTop.addEventListener('click', () => {
      if (!modalPreviewImg) return;
      const currentH = (modalPreviewImg.naturalHeight * cropState.baseScale) * cropState.scale;
      cropState.offsetY = Math.max(0, (currentH - 250) / 2);
      updateCropTransform();
    });
  }

  if (cropBtnCenter) {
    cropBtnCenter.addEventListener('click', () => {
      cropState.offsetX = 0;
      cropState.offsetY = 0;
      updateCropTransform();
    });
  }

  if (cropBtnBottom) {
    cropBtnBottom.addEventListener('click', () => {
      if (!modalPreviewImg) return;
      const currentH = (modalPreviewImg.naturalHeight * cropState.baseScale) * cropState.scale;
      cropState.offsetY = -Math.max(0, (currentH - 250) / 2);
      updateCropTransform();
    });
  }

  if (cropBtnReset) {
    cropBtnReset.addEventListener('click', resetCropState);
  }

  function openImageModal(targetImgId, label) {
    currentTargetImageId = targetImgId;
    const targetImg = document.querySelector(`[data-img-id="${targetImgId}"]`);
    if (!targetImg) return;

    if (modalTargetName) modalTargetName.textContent = `เปลี่ยนรูป : ${label}`;
    if (modalImageUrlInput) modalImageUrlInput.value = targetImg.src.startsWith('data:') ? '' : targetImg.src;
    if (modalPreviewImg) {
      modalPreviewImg.src = targetImg.src;
      resetCropState();
    }
    if (imageModal) {
      imageModal.classList.add('active');
      imageModal.classList.add('show');
    }
  }

  function closeImageModal() {
    imageModal.classList.remove('active');
    imageModal.classList.remove('show');
    currentTargetImageId = null;
    modalFileInput.value = '';
  }

  function handleModalFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ที่เป็นรูปภาพ (JPG, PNG, WEBP, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      modalPreviewImg.src = dataUrl;
      modalImageUrlInput.value = '';
      resetCropState();
    };
    reader.readAsDataURL(file);
  }

  function applyImageModalChanges() {
    if (!currentTargetImageId) return;
    const targetImg = document.querySelector(`[data-img-id="${currentTargetImageId}"]`);
    if (!targetImg || !modalPreviewImg.src) {
      closeImageModal();
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      const viewSize = 250;
      const ratio = 600 / viewSize;

      ctx.save();
      ctx.translate(300 + cropState.offsetX * ratio, 300 + cropState.offsetY * ratio);
      ctx.scale(cropState.scale, cropState.scale);

      const drawW = (modalPreviewImg.naturalWidth * cropState.baseScale) * ratio;
      const drawH = (modalPreviewImg.naturalHeight * cropState.baseScale) * ratio;

      ctx.drawImage(modalPreviewImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      targetImg.src = croppedUrl;
      saveStateToLocalStorage();
      showToast('ครอบตัดและเปลี่ยนรูปภาพเรียบร้อยแล้ว!');
    } catch (err) {
      console.warn('Canvas export fallback (likely cross-origin image):', err);
      targetImg.src = modalPreviewImg.src;
      saveStateToLocalStorage();
      showToast('เปลี่ยนรูปภาพเรียบร้อยแล้ว!');
    }

    closeImageModal();
  }

  function restoreDefaultImageForTarget() {
    if (!currentTargetImageId || !originalDefaultState.imageData) return;
    const defaultSrc = originalDefaultState.imageData[currentTargetImageId];
    if (defaultSrc) {
      modalPreviewImg.src = defaultSrc;
      modalImageUrlInput.value = defaultSrc;
      resetCropState();
    }
  }

  /* -----------------------------------------------------------
     INTERACTIVE TABS
     ----------------------------------------------------------- */
  function initTabs() {
    const tabBtns = document.querySelectorAll('.timeline-tab-btn');
    const cards = document.querySelectorAll('.context-card');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        cards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.4s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* -----------------------------------------------------------
     AMBIENT AUDIO (SUBTLE VINTAGE TONE CHIME)
     ----------------------------------------------------------- */
  function initAmbientAudio() {
    const btnAudio = document.getElementById('btnNavAudio');
    if (!btnAudio) return;

    let audioCtx = null;
    let isPlaying = false;
    let intervalId = null;

    btnAudio.addEventListener('click', () => {
      if (!isPlaying) {
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          isPlaying = true;
          btnAudio.style.background = 'var(--accent-brass)';
          btnAudio.style.color = '#fff';
          playChime(audioCtx);
          intervalId = setInterval(() => {
            if (isPlaying && audioCtx) playChime(audioCtx);
          }, 14000);
          showToast('เปิดเสียงระฆังโบราณคลอเบาๆ แล้ว');
        } catch (e) {
          console.log('AudioContext not allowed without gesture', e);
        }
      } else {
        isPlaying = false;
        clearInterval(intervalId);
        if (audioCtx) audioCtx.close();
        btnAudio.style.background = '';
        btnAudio.style.color = '';
        showToast('ปิดเสียงแล้ว');
      }
    });

    function playChime(ctx) {
      const frequencies = [528, 660, 792, 1056];
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 4.8);
    }
  }

  /* -----------------------------------------------------------
     TOAST NOTIFICATION
     ----------------------------------------------------------- */
  let toastTimer = null;
  function showToast(message) {
    if (!vintageToast) return;
    vintageToast.textContent = message;
    vintageToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      vintageToast.classList.remove('show');
    }, 3200);
  }

  /* -----------------------------------------------------------
     GOOGLE SITES IFRAME RESPONSIVE RESIZER COMMUNICATION
     ----------------------------------------------------------- */
  function notifyParentIframe() {
    if (window.parent && window.parent !== window) {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize-iframe', height: height }, '*');
    }
  }

  /* -----------------------------------------------------------
     SCROLL REVEAL & DYNAMIC ANIMATIONS (อนิเมชันขยับได้)
     ----------------------------------------------------------- */
  function initScrollAnimations() {
    const targets = document.querySelectorAll(
      '.dimension-article-card, .philosophy-quote-frame, .philo-text-card, .purpose-container-box, .pedagogy-card, .pioneer-full-card, .legacy-deep-card, .section-heading-wrap'
    );

    targets.forEach((el, index) => {
      el.classList.add('reveal-on-scroll');
      if (index % 3 === 1) el.classList.add('delay-1');
      if (index % 3 === 2) el.classList.add('delay-2');
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
      });

      targets.forEach(el => observer.observe(el));
    } else {
      targets.forEach(el => el.classList.add('is-revealed'));
    }
  }

  initScrollAnimations();

  /* -----------------------------------------------------------
     INTERACTIVE CARD 3D TILT EFFECT
     ----------------------------------------------------------- */
  document.querySelectorAll('.dimension-article-card, .pedagogy-card, .pioneer-full-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2.5;
      const rotateY = ((x - centerX) / centerX) * 2.5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.008)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  window.addEventListener('resize', notifyParentIframe);
  window.addEventListener('load', notifyParentIframe);
  const observer = new MutationObserver(notifyParentIframe);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
});
