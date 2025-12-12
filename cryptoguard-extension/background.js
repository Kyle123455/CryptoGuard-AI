// Free threat intelligence sources
const FREE_THREAT_LISTS = {
    "PhishTank": "https://data.phishtank.com/data/online-valid.json",
    "CryptoScamDB": "https://api.cryptoscamdb.org/v1/scams",
    "OpenPhish": "https://openphish.com/feed.txt"
};

let knownThreats = [];

// Load threat data on install
chrome.runtime.onInstalled.addListener(() => {
    console.log("CryptoGuard AI installed");
    loadThreatData();
    
    // Check for updates every 6 hours
    chrome.alarms.create('updateThreatData', { periodInMinutes: 360 });
});

// Load threat data from free sources
async function loadThreatData() {
    try {
        const response = await fetch("https://api.cryptoscamdb.org/v1/scams");
        const data = await response.json();
        
        knownThreats = data.result || [];
        console.log(`Loaded ${knownThreats.length} known threats`);
        
        chrome.storage.local.set({ 
            threatsLoaded: new Date().toISOString(),
            threatCount: knownThreats.length 
        });
    } catch (error) {
        console.log("Using fallback threat list");
        // Fallback to a small static list
        knownThreats = [
            { url: "fake-metamask.io", type: "phishing" },
            { url: "claim-uniswap.org", type: "phishing" },
            { url: "pancakeswap-login.com", type: "phishing" }
        ];
    }
}

// Check URL against known threats
function checkURL(url) {
    const domain = new URL(url).hostname;
    
    for (const threat of knownThreats) {
        if (threat.url && domain.includes(threat.url)) {
            return {
                isThreat: true,
                type: threat.type || "phishing",
                confidence: "high"
            };
        }
    }
    
    // Simple heuristic checks
    const suspiciousPatterns = [
        "wallet-connect",
        "metamask",
        "trustwallet",
        "login",
        "verify",
        "secure",
        "claim"
    ];
    
    const suspiciousKeywords = suspiciousPatterns.filter(keyword => 
        domain.includes(keyword) && !url.includes("official")
    );
    
    if (suspiciousKeywords.length > 1) {
        return {
            isThreat: true,
            type: "suspicious",
            confidence: "medium",
            reasons: ["Multiple suspicious keywords found"]
        };
    }
    
    return { isThreat: false };
}

// Listen for navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        chrome.storage.local.get(['phishingProtection'], function(result) {
            if (result.phishingProtection !== false) {
                const check = checkURL(tab.url);
                if (check.isThreat) {
                    chrome.tabs.sendMessage(tabId, {
                        action: "showWarning",
                        threatInfo: check
                    }).catch(() => {
                        // Content script not ready
                    });
                }
            }
        });
    }
});

// Alarm for updating data
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateThreatData') {
        loadThreatData();
    }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkURL") {
        const result = checkURL(request.url);
        sendResponse(result);
    }
    return true;
});
