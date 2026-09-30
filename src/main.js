import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Dynamic Year in Footer ---
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // --- 2. Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when clicking any link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // --- 3. Navbar scroll effect (Glassmorphism) ---
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 15) {
      header.classList.add('shadow-xl', 'bg-night/95', 'backdrop-blur-lg');
      header.classList.remove('border-transparent');
      header.classList.add('border-b', 'border-slate-800/80');
    } else {
      header.classList.remove('shadow-xl', 'bg-night/95', 'backdrop-blur-lg', 'border-b', 'border-slate-800/80');
      header.classList.add('border-transparent');
    }
  });

  // --- 4. Scroll Reveal via IntersectionObserver ---
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // --- 5. Tabs Logic (Servizi & Prezzi) ---
  const tabWeb = document.getElementById('tab-web');
  const tabSocial = document.getElementById('tab-social');
  const contentWeb = document.getElementById('content-web');
  const contentSocial = document.getElementById('content-social');

  if (tabWeb && tabSocial && contentWeb && contentSocial) {
    const activateWeb = () => {
      tabWeb.classList.add('bg-cobalt', 'text-white', 'shadow-md');
      tabWeb.classList.remove('text-slate-400');
      tabSocial.classList.remove('bg-cobalt', 'text-white', 'shadow-md');
      tabSocial.classList.add('text-slate-400');
      
      contentWeb.classList.remove('hidden');
      contentWeb.classList.add('block', 'tab-content-active');
      contentSocial.classList.remove('block', 'tab-content-active');
      contentSocial.classList.add('hidden');
    };

    const activateSocial = () => {
      tabSocial.classList.add('bg-cobalt', 'text-white', 'shadow-md');
      tabSocial.classList.remove('text-slate-400');
      tabWeb.classList.remove('bg-cobalt', 'text-white', 'shadow-md');
      tabWeb.classList.add('text-slate-400');
      
      contentSocial.classList.remove('hidden');
      contentSocial.classList.add('block', 'tab-content-active');
      contentWeb.classList.remove('block', 'tab-content-active');
      contentWeb.classList.add('hidden');
    };

    tabWeb.addEventListener('click', activateWeb);
    tabSocial.addEventListener('click', activateSocial);
  }

  // --- 6. Tabs Logic (Portfolio) ---
  const pTabWeb = document.getElementById('p-tab-web');
  const pTabSocial = document.getElementById('p-tab-social');
  const pContentWeb = document.getElementById('p-content-web');
  const pContentSocial = document.getElementById('p-content-social');

  if (pTabWeb && pTabSocial && pContentWeb && pContentSocial) {
    const pActivateWeb = () => {
      pTabWeb.classList.add('bg-slate-700', 'text-white', 'shadow-sm');
      pTabWeb.classList.remove('text-slate-400');
      pTabSocial.classList.remove('bg-slate-700', 'text-white', 'shadow-sm');
      pTabSocial.classList.add('text-slate-400');
      
      pContentWeb.classList.remove('hidden');
      pContentWeb.classList.add('grid', 'tab-content-active');
      pContentSocial.classList.remove('block', 'tab-content-active');
      pContentSocial.classList.add('hidden');
    };

    const pActivateSocial = () => {
      pTabSocial.classList.add('bg-slate-700', 'text-white', 'shadow-sm');
      pTabSocial.classList.remove('text-slate-400');
      pTabWeb.classList.remove('bg-slate-700', 'text-white', 'shadow-sm');
      pTabWeb.classList.add('text-slate-400');
      
      pContentSocial.classList.remove('hidden');
      pContentSocial.classList.add('block', 'tab-content-active');
      pContentWeb.classList.remove('grid', 'tab-content-active');
      pContentWeb.classList.add('hidden');
    };

    pTabWeb.addEventListener('click', pActivateWeb);
    pTabSocial.addEventListener('click', pActivateSocial);
  }

  // --- 7. GDPR Cookie Banner & Policy Modals ---
  const COOKIE_STORAGE_KEY = 'quota_cookie_consent';
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000; // 6 months in ms

  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAcceptAll = document.getElementById('cookie-accept-all');
  const cookieRejectAll = document.getElementById('cookie-reject-all');
  const cookieCustomize = document.getElementById('cookie-customize');
  const cookieCloseBtn = document.getElementById('cookie-close-btn');

  const cookieCustomModal = document.getElementById('cookie-custom-modal');
  const toggleAnalytics = document.getElementById('toggle-analytics');
  const cookieSaveCustom = document.getElementById('cookie-save-custom');
  const closeCustomModal = document.getElementById('close-custom-modal');

  const privacyModal = document.getElementById('privacy-modal');
  const cookiePolicyModal = document.getElementById('cookie-policy-modal');
  const contactModal = document.getElementById('contact-modal');

  const openPrivacyLinks = document.querySelectorAll('.open-privacy-modal');
  const openCookiePolicyLinks = document.querySelectorAll('.open-cookie-policy-modal');
  const openCookieSettingsLinks = document.querySelectorAll('.open-cookie-settings');
  const openContactBtns = document.querySelectorAll('.open-contact-modal');

  const allModals = [cookieCustomModal, privacyModal, cookiePolicyModal, contactModal].filter(Boolean);

  // Helper: Open / Close Modals
  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    // Check if any other modal is open before removing overflow-hidden
    const isAnyOpen = allModals.some(m => m.classList.contains('is-open'));
    if (!isAnyOpen) {
      document.body.classList.remove('overflow-hidden');
    }
  };

  // Close modals on click outside content box or on close button
  allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal-close-btn')) {
        closeModal(modal);
      }
    });
  });

  // Close modals on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(modal => closeModal(modal));
    }
  });

  // Open triggers
  openPrivacyLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(privacyModal);
    });
  });

  openCookiePolicyLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(cookiePolicyModal);
    });
  });

  openCookieSettingsLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Load current preference into toggle
      const consent = getConsentData();
      if (toggleAnalytics) {
        toggleAnalytics.checked = consent ? consent.analytics : false;
      }
      openModal(cookieCustomModal);
    });
  });

  openContactBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(contactModal);
    });
  });

  // Read saved consent
  function getConsentData() {
    try {
      const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Validate structure & expiration (6 months)
      if (data && data.timestamp && (Date.now() - data.timestamp < SIX_MONTHS_MS)) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Save consent
  function saveConsent(status, analyticsAllowed) {
    const data = {
      status,
      technical: true,
      analytics: analyticsAllowed,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save cookie consent:', e);
    }
    
    // Hide banner smoothly
    if (cookieBanner) {
      cookieBanner.classList.add('translate-y-full');
    }
  }

  // Initialize Banner check
  const existingConsent = getConsentData();
  if (!existingConsent && cookieBanner) {
    setTimeout(() => {
      cookieBanner.classList.remove('translate-y-full');
    }, 800);
  }

  // Banner Actions
  if (cookieAcceptAll) {
    cookieAcceptAll.addEventListener('click', () => {
      saveConsent('accepted_all', true);
    });
  }

  if (cookieRejectAll) {
    cookieRejectAll.addEventListener('click', () => {
      saveConsent('rejected', false);
    });
  }

  if (cookieCloseBtn) {
    cookieCloseBtn.addEventListener('click', () => {
      // Closing equals rejecting optional cookies
      saveConsent('rejected', false);
    });
  }

  if (cookieCustomize) {
    cookieCustomize.addEventListener('click', () => {
      const consent = getConsentData();
      if (toggleAnalytics) {
        toggleAnalytics.checked = consent ? consent.analytics : false;
      }
      openModal(cookieCustomModal);
    });
  }

  if (cookieSaveCustom && toggleAnalytics) {
    cookieSaveCustom.addEventListener('click', () => {
      const isAnalytics = toggleAnalytics.checked;
      saveConsent('custom', isAnalytics);
      closeModal(cookieCustomModal);
    });
  }

  if (closeCustomModal) {
    closeCustomModal.addEventListener('click', () => {
      closeModal(cookieCustomModal);
    });
  }

  // --- 8. Contact Form Logic (Vercel Serverless & Postgres) ---
  const contactForm = document.getElementById('contact-form');
  const contactFeedback = document.getElementById('contact-feedback');
  const contactSubmitBtn = document.getElementById('contact-submit-btn');
  const contactBtnText = document.getElementById('contact-btn-text');
  const contactBtnSpinner = document.getElementById('contact-btn-spinner');

  if (contactForm) {
    // Helper feedback function
    const showContactFeedback = (message, isError = true) => {
      if (!contactFeedback) return;
      contactFeedback.className = 'p-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all border';
      if (isError) {
        contactFeedback.classList.add('bg-rose-500/15', 'text-rose-300', 'border-rose-500/40');
      } else {
        contactFeedback.classList.add('bg-emerald-500/15', 'text-emerald-300', 'border-emerald-500/40');
      }
      contactFeedback.textContent = message;
      contactFeedback.classList.remove('hidden');
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('contact-nome')?.value.trim() || '';
      const cognome = document.getElementById('contact-cognome')?.value.trim() || '';
      const attivita = document.getElementById('contact-attivita')?.value.trim() || '';
      const telefono = document.getElementById('contact-telefono')?.value.trim() || '';
      const email = document.getElementById('contact-email')?.value.trim() || '';
      const messaggio = document.getElementById('contact-messaggio')?.value.trim() || '';
      const privacy = document.getElementById('contact-privacy')?.checked;
      const hp = document.getElementById('contact-hp')?.value || '';

      // Validazione lato client
      if (!nome || !cognome || !attivita || !telefono || !email) {
        showContactFeedback('Tutti i campi contrassegnati con * sono obbligatori.', true);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showContactFeedback('Inserisci un indirizzo email valido.', true);
        return;
      }

      const phoneCleanDigits = telefono.replace(/[^0-9]/g, '');
      if (phoneCleanDigits.length < 6) {
        showContactFeedback('Inserisci un numero di cellulare valido.', true);
        return;
      }

      if (!privacy) {
        showContactFeedback('È necessario accettare l\'Informativa sulla Privacy per procedere.', true);
        return;
      }

      // Stato di caricamento
      if (contactSubmitBtn) contactSubmitBtn.disabled = true;
      if (contactBtnText) contactBtnText.textContent = 'Invio in corso...';
      if (contactBtnSpinner) contactBtnSpinner.classList.remove('hidden');
      if (contactFeedback) contactFeedback.classList.add('hidden');

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome,
            cognome,
            nome_attivita: attivita,
            telefono,
            email,
            messaggio,
            privacy,
            _hp: hp,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showContactFeedback(result.message || 'Richiesta inviata con successo!', false);
          contactForm.reset();

          // Chiusura automatica della modale dopo 3.5 secondi
          setTimeout(() => {
            closeModal(contactModal);
            if (contactFeedback) contactFeedback.classList.add('hidden');
          }, 3500);
        } else {
          showContactFeedback(result.message || 'Si è verificato un errore durante l\'invio. Riprova più tardi.', true);
        }
      } catch (err) {
        console.error('Errore invio form:', err);
        showContactFeedback('Errore di connessione con il server. Verifica la rete o scrivici direttamente su WhatsApp.', true);
      } finally {
        if (contactSubmitBtn) contactSubmitBtn.disabled = false;
        if (contactBtnText) contactBtnText.textContent = 'Invia Richiesta';
        if (contactBtnSpinner) contactBtnSpinner.classList.add('hidden');
      }
    });
  }
});
