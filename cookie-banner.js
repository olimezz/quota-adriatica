document.addEventListener("DOMContentLoaded", () => {
    const COOKIE_NAME = 'quota_adriatica_cookie_consent';
    const GTM_ID = ''; // Placeholder in case they want to add GTM later

    // HTML Structure for the banner
    const bannerHTML = `
        <div id="cookie-banner" class="cookie-banner" style="display: none;">
            <div class="cookie-banner-content">
                <div class="cookie-text">
                    <h3>La tua privacy è importante</h3>
                    <p>
                        Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito web, per analizzare il traffico e per fornirti contenuti personalizzati. Puoi scegliere di accettare tutti i cookie, rifiutare quelli non essenziali o gestire le tue preferenze.
                        Per maggiori informazioni, consulta la nostra <a href="/cookie-policy.html">Cookie Policy</a>.
                    </p>
                </div>
                <div class="cookie-buttons">
                    <button id="btn-accept-all" class="btn-cookie btn-primary">Accetta Tutti</button>
                    <button id="btn-reject-all" class="btn-cookie btn-secondary">Solo Necessari (Rifiuta)</button>
                    <button id="btn-manage" class="btn-cookie btn-outline">Gestisci Preferenze</button>
                </div>
            </div>
        </div>

        <div id="cookie-modal" class="cookie-modal" style="display: none;">
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h3>Gestisci le preferenze sui Cookie</h3>
                    <button id="btn-close-modal" class="btn-close-modal">&times;</button>
                </div>
                <div class="cookie-modal-body">
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Necessari (Sempre attivi)</h4>
                            <label class="switch">
                                <input type="checkbox" checked disabled>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <p>I cookie necessari aiutano a contribuire a rendere fruibile un sito web abilitando le funzioni di base come la navigazione della pagina e l'accesso alle aree protette del sito. Il sito web non può funzionare correttamente senza questi cookie.</p>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Analitici</h4>
                            <label class="switch">
                                <input type="checkbox" id="chk-analytics">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <p>I cookie statistici aiutano i proprietari del sito web a capire come i visitatori interagiscono con i siti raccogliendo e trasmettendo informazioni in forma anonima.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h4>Marketing e Profilazione</h4>
                            <label class="switch">
                                <input type="checkbox" id="chk-marketing">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <p>I cookie per il marketing vengono utilizzati per monitorare i visitatori nei siti web. L'intento è quello di visualizzare annunci pertinenti e coinvolgenti per il singolo utente.</p>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button id="btn-save-preferences" class="btn-cookie btn-primary">Salva Preferenze</button>
                </div>
            </div>
        </div>

        <button id="cookie-settings-btn" class="cookie-settings-btn" aria-label="Impostazioni Cookie" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cookie"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>
        </button>
    `;

    // Inject HTML into body
    document.body.insertAdjacentHTML('beforeend', bannerHTML);

    const banner = document.getElementById('cookie-banner');
    const modal = document.getElementById('cookie-modal');
    const settingsBtn = document.getElementById('cookie-settings-btn');
    
    const btnAcceptAll = document.getElementById('btn-accept-all');
    const btnRejectAll = document.getElementById('btn-reject-all');
    const btnManage = document.getElementById('btn-manage');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSavePreferences = document.getElementById('btn-save-preferences');

    const chkAnalytics = document.getElementById('chk-analytics');
    const chkMarketing = document.getElementById('chk-marketing');

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        const expires = "expires="+ d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const cname = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(cname) == 0) {
                return c.substring(cname.length, c.length);
            }
        }
        return "";
    }

    function applyConsent(consent) {
        // Save to cookie for 365 days
        setCookie(COOKIE_NAME, JSON.stringify(consent), 365);
        
        banner.style.display = 'none';
        modal.style.display = 'none';
        settingsBtn.style.display = 'flex';

        // Here we trigger scripts depending on consent
        if(consent.analytics) {
            enableAnalytics();
        }
        if(consent.marketing) {
            enableMarketing();
        }
    }

    function enableAnalytics() {
        // Example: load Google Analytics or unlock iframes
        console.log("Analytics Enabled");
        // GTM DataLayer Push
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
        
        // Se si usano iframe con data-src al posto di src per bloccarli, sbloccarli qui:
        const iframes = document.querySelectorAll('iframe[data-src]');
        iframes.forEach(iframe => {
            iframe.src = iframe.getAttribute('data-src');
            iframe.removeAttribute('data-src');
        });
    }

    function enableMarketing() {
        // Example: load Facebook Pixel, Google Ads
        console.log("Marketing Enabled");
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted'
        });
    }

    // Default Initialization
    const currentConsent = getCookie(COOKIE_NAME);
    
    if (!currentConsent) {
        // First visit
        banner.style.display = 'flex';
        // Set default denied consent for GTM if needed
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
        });
    } else {
        // Consent exists
        const consentObj = JSON.parse(currentConsent);
        settingsBtn.style.display = 'flex';
        
        if(consentObj.analytics) enableAnalytics();
        if(consentObj.marketing) enableMarketing();
        
        chkAnalytics.checked = consentObj.analytics;
        chkMarketing.checked = consentObj.marketing;
    }

    // Event Listeners
    btnAcceptAll.addEventListener('click', () => {
        applyConsent({
            necessary: true,
            analytics: true,
            marketing: true
        });
    });

    btnRejectAll.addEventListener('click', () => {
        applyConsent({
            necessary: true,
            analytics: false,
            marketing: false
        });
    });

    btnManage.addEventListener('click', () => {
        banner.style.display = 'none';
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
        if(!getCookie(COOKIE_NAME)) {
            banner.style.display = 'flex';
        }
        modal.style.display = 'none';
    });

    btnSavePreferences.addEventListener('click', () => {
        applyConsent({
            necessary: true,
            analytics: chkAnalytics.checked,
            marketing: chkMarketing.checked
        });
    });

    settingsBtn.addEventListener('click', () => {
        const consent = getCookie(COOKIE_NAME);
        if (consent) {
            const consentObj = JSON.parse(consent);
            chkAnalytics.checked = consentObj.analytics;
            chkMarketing.checked = consentObj.marketing;
        }
        modal.style.display = 'flex';
    });
});
