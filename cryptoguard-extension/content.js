// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showWarning") {
        showWarningBanner(message.threatInfo);
    }
});

// Show warning banner on page
function showWarningBanner(threatInfo) {
    if (document.getElementById('cryptoguard-warning')) return;
    
    const warning = document.createElement('div');
    warning.id = 'cryptoguard-warning';
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #7c2d12, #9a3412);
        color: white;
        padding: 15px;
        z-index: 999999;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;
    
    warning.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
            <div>
                <strong>🚨 CryptoGuard AI Security Alert</strong>
                <div style="font-size: 14px; margin-top: 2px;">
                    This site may be ${threatInfo.type === 'phishing' ? 'a phishing scam' : 'suspicious'}.
                    Exercise extreme caution.
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="cryptoguard-learn" style="padding: 6px 12px; background: rgba(255,255,255,0.2); border: 1px solid white; color: white; border-radius: 4px; cursor: pointer;">
                Learn More
            </button>
            <button id="cryptoguard-close" style="padding: 6px 12px; background: transparent; border: none; color: white; cursor: pointer; font-size: 18px;">
                ×
            </button>
        </div>
    `;
    
    // Add Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }
    
    document.body.prepend(warning);
    document.body.style.marginTop = warning.offsetHeight + 'px';
    
    // Button events
    document.getElementById('cryptoguard-learn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "openSafetyTips" });
    });
    
    document.getElementById('cryptoguard-close').addEventListener('click', () => {
        warning.remove();
        document.body.style.marginTop = '';
    });
}

// Monitor for crypto wallet mentions on page
function monitorPageContent() {
    const walletKeywords = [
        'seed phrase', 'private key', 'mnemonic', 'keystore',
        'connect wallet', 'wallet connection', 'authorize',
        'claim tokens', 'free tokens', 'airdrop'
    ];
    
    const pageText = document.body.innerText.toLowerCase();
    let foundKeywords = [];
    
    walletKeywords.forEach(keyword => {
        if (pageText.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });
    
    if (foundKeywords.length > 2) {
        // Send warning to popup
        chrome.runtime.sendMessage({
            action: "contentWarning",
            keywords: foundKeywords
        });
    }
}

// Run initial monitoring
setTimeout(monitorPageContent, 2000);

// Monitor dynamic content
const observer = new MutationObserver(() => {
    monitorPageContent();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});
