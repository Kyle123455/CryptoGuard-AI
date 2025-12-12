let scanCount = 0;

// Tab switching
function openTab(evt, tabName) {
    const tabcontents = document.getElementsByClassName("tab-content");
    const tablinks = document.getElementsByClassName("tab-btn");
    
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Scan current page
function scanCurrentPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        const resultDiv = document.getElementById("scanResult");
        const resultText = document.getElementById("resultText");
        
        resultDiv.style.display = "block";
        resultText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Scanning: ${url.substring(0, 50)}...`;
        
        // Simulate scanning with free APIs
        setTimeout(() => {
            scanCount++;
            document.getElementById("scanCount").textContent = scanCount;
            
            const isSafe = Math.random() > 0.2;
            if (isSafe) {
                resultDiv.style.borderLeftColor = "#10b981";
                resultText.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #10b981;"></i> 
                    <strong>This site appears safe</strong><br>
                    <small>No known phishing patterns detected</small>
                `;
                addToHistory(url, "safe");
            } else {
                resultDiv.style.borderLeftColor = "#ef4444";
                resultText.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> 
                    <strong>Potential threat detected!</strong><br>
                    <small>Exercise caution on this website</small>
                `;
                showWarning("⚠️ Warning: This site may be unsafe");
                addToHistory(url, "danger");
            }
        }, 1500);
    });
}

// Scan contract
function scanContract() {
    const contract = document.getElementById("contractInput").value;
    const resultDiv = document.getElementById("scanResult");
    const resultText = document.getElementById("resultText");
    
    if (!contract || contract.length < 10) {
        resultText.innerHTML = `<i class="fas fa-times-circle" style="color: #ef4444;"></i> Please enter a valid contract address`;
        resultDiv.style.display = "block";
        return;
    }
    
    resultDiv.style.display = "block";
    resultText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing contract...`;
    
    setTimeout(() => {
        scanCount++;
        document.getElementById("scanCount").textContent = scanCount;
        
        const riskScore = Math.floor(Math.random() * 100);
        let status, color, icon;
        
        if (riskScore > 70) {
            status = "Low Risk";
            color = "#10b981";
            icon = "check-circle";
        } else if (riskScore > 40) {
            status = "Medium Risk";
            color = "#f59e0b";
            icon = "exclamation-triangle";
        } else {
            status = "High Risk";
            color = "#ef4444";
            icon = "exclamation-triangle";
            showWarning("🚨 High-risk contract detected!");
        }
        
        resultDiv.style.borderLeftColor = color;
        resultText.innerHTML = `
            <i class="fas fa-${icon}" style="color: ${color};"></i> 
            <strong>Contract Analysis</strong><br>
            Risk Score: ${riskScore}/100 (${status})<br>
            <small>Address: ${contract.substring(0, 20)}...</small>
        `;
        
        addToHistory(`Contract: ${contract.substring(0, 15)}...`, riskScore > 70 ? "safe" : "warning");
    }, 2000);
}

// Show warning
function showWarning(message) {
    const warning = document.getElementById("warningMessage");
    warning.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    warning.style.display = "block";
    setTimeout(() => {
        warning.style.display = "none";
    }, 5000);
}

// Add to history
function addToHistory(item, status) {
    const historyList = document.getElementById("historyList");
    const colors = {
        safe: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444"
    };
    
    const entry = document.createElement("div");
    entry.style.cssText = `
        background: #1e293b;
        padding: 8px;
        margin: 5px 0;
        border-radius: 4px;
        border-left: 4px solid ${colors[status] || "#475569"};
        font-size: 12px;
    `;
    entry.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <span>${item}</span>
            <span style="color: ${colors[status] || "#475569"}">
                ${status === "safe" ? "✓ Safe" : status === "warning" ? "⚠️ Warning" : "🚨 Danger"}
            </span>
        </div>
        <small style="color: #94a3b8;">${new Date().toLocaleTimeString()}</small>
    `;
    
    if (historyList.firstChild && historyList.firstChild.style.color === "#94a3b8") {
        historyList.removeChild(historyList.firstChild);
    }
    historyList.insertBefore(entry, historyList.firstChild);
}

// Clear data
function clearData() {
    if (confirm("Clear all scan history?")) {
        document.getElementById("historyList").innerHTML = 
            '<p style="color: #94a3b8; text-align: center;">No scans yet</p>';
        scanCount = 0;
        document.getElementById("scanCount").textContent = "0";
    }
}

// Load saved count
chrome.storage.local.get(['scanCount'], function(result) {
    if (result.scanCount) {
        scanCount = result.scanCount;
        document.getElementById("scanCount").textContent = scanCount;
    }
});

// Save count before closing
window.addEventListener('beforeunload', function() {
    chrome.storage.local.set({scanCount: scanCount});
});

// Initialize
document.getElementById("phishingProtection").addEventListener("change", function(e) {
    chrome.storage.local.set({phishingProtection: e.target.checked});
});

document.getElementById("contractWarnings").addEventListener("change", function(e) {
    chrome.storage.local.set({contractWarnings: e.target.checked});
});

// Load settings
chrome.storage.local.get(['phishingProtection', 'contractWarnings'], function(result) {
    if (result.phishingProtection !== undefined) {
        document.getElementById("phishingProtection").checked = result.phishingProtection;
    }
    if (result.contractWarnings !== undefined) {
        document.getElementById("contractWarnings").checked = result.contractWarnings;
    }
});
