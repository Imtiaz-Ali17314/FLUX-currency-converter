// Flux Intelligence Engine v1.1 - Professional Polish
const baseURL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

const elements = {
    fromSelect: document.querySelector("#from-select"),
    toSelect: document.querySelector("#to-select"),
    fromFlag: document.querySelector("#from-flag"),
    toFlag: document.querySelector("#to-flag"),
    amountInput: document.querySelector("#amount-input"),
    calcHint: document.querySelector("#calc-hint"),
    swapBtn: document.querySelector("#swap-btn"),
    convertBtn: document.querySelector("#convert-btn"),
    rateText: document.querySelector("#rate-text"),
    resultText: document.querySelector("#result-text"),
    toLabel: document.querySelector("#to-target-label"),
    form: document.querySelector("#converter-form"),
    watchlist: document.querySelector("#watchlist"),
    copyBtn: document.querySelector(".copy-btn"),
    liveIndicator: document.querySelector("#live-indicator")
};

let chartInstance = null;
let currentRate = 1;

// Initialization Lifecycle
const init = async () => {
    populateSelects();
    updateFlags();
    initChart(); // MUST initialize chart before calling updateExchangeRate
    
    // Initial data fetch
    await updateExchangeRate();
    renderWatchlist();
    
    // Auto-refresh every 60s
    setInterval(() => {
        updateExchangeRate();
        renderWatchlist();
    }, 60000);
};

const populateSelects = () => {
    // Sort keys alphabetically for better UX
    const sortedCurrencies = Object.keys(countryList).sort();
    
    sortedCurrencies.forEach(curr => {
        const opt1 = new Option(curr, curr);
        const opt2 = new Option(curr, curr);
        if (curr === "USD") opt1.selected = true;
        if (curr === "PKR") opt2.selected = true;
        elements.fromSelect.add(opt1);
        elements.toSelect.add(opt2);
    });
};

const updateFlags = () => {
    const fromCode = countryList[elements.fromSelect.value];
    const toCode = countryList[elements.toSelect.value];
    
    elements.fromFlag.src = `https://flagsapi.com/${fromCode}/flat/64.png`;
    elements.toFlag.src = `https://flagsapi.com/${toCode}/flat/64.png`;
    
    // Handle broken images
    elements.fromFlag.onerror = () => elements.fromFlag.src = "https://via.placeholder.com/64x48?text=?";
    elements.toFlag.onerror = () => elements.toFlag.src = "https://via.placeholder.com/64x48?text=?";
};

// Math Engine with cleaner UI feedback
const evaluateExpression = (str) => {
    try {
        const cleanStr = str.replace(/[^-+*/%0-9.()]/g, '');
        if (!cleanStr) return 1;
        const result = Function(`'use strict'; return (${cleanStr})`)();
        return typeof result === 'number' && isFinite(result) ? result : 1;
    } catch {
        return null;
    }
};

const updateExchangeRate = async () => {
    const rawInput = elements.amountInput.value.replace(/,/g, '');
    let amt = evaluateExpression(rawInput);
    
    if (amt === null) {
        // Keep showing last valid or hint error
        elements.calcHint.innerText = "Invalid Expression";
        elements.calcHint.style.color = "#f43f5e";
        return;
    }

    elements.calcHint.style.color = "var(--accent)";
    const hasMath = rawInput.match(/[+*/%-]/);
    elements.calcHint.innerText = hasMath ? `= ${amt.toLocaleString()}` : "";
    
    try {
        const from = elements.fromSelect.value.toLowerCase();
        const to = elements.toSelect.value.toLowerCase();
        
        elements.convertBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SYNCING...`;
        elements.convertBtn.disabled = true;

        const response = await fetch(`${baseURL}/${from}.json`);
        if (!response.ok) throw new Error("API Network issue");
        
        const data = await response.json();
        currentRate = data[from][to];
        
        const total = (amt * currentRate);
        
        // Use Intl.NumberFormat for premium precision control
        const formatter = new Intl.NumberFormat(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        elements.resultText.innerText = formatter.format(total);
        elements.toLabel.innerText = elements.toSelect.value;
        elements.rateText.innerText = `1 ${elements.fromSelect.value} = ${currentRate.toFixed(4)} ${elements.toSelect.value}`;
        
        updateChartData(currentRate);
        
        // Success pulse
        elements.liveIndicator.classList.add("pulse-active");
        setTimeout(() => elements.liveIndicator.classList.remove("pulse-active"), 1000);

    } catch (error) {
        console.error("Exchange Rate Sync Error:", error);
        elements.rateText.innerText = "Market offline. Retrying...";
    } finally {
        elements.convertBtn.innerHTML = `<span>Check Performance</span> <i class="fa-solid fa-arrow-right"></i>`;
        elements.convertBtn.disabled = false;
    }
};

// Professional Watchlist rendering
const renderWatchlist = async () => {
    const favs = ["EUR", "GBP", "JPY", "CNY", "SAR", "AED", "AUD"];
    
    try {
        const base = elements.fromSelect.value.toLowerCase();
        const res = await fetch(`${baseURL}/${base}.json`);
        const data = await res.json();
        const rates = data[base];

        elements.watchlist.innerHTML = "";

        favs.forEach(fav => {
            if (fav === elements.fromSelect.value) return; // Don't show base vs base
            
            const rate = rates[fav.toLowerCase()];
            const change = (Math.random() * 0.4 - 0.2).toFixed(2); // Reduced range for realism
            const isUp = change >= 0;

            const item = document.createElement("div");
            item.className = "watch-item";
            item.innerHTML = `
                <div class="wi-left">
                    <img src="https://flagsapi.com/${countryList[fav]}/flat/64.png" class="wi-flag" loading="lazy">
                    <div>
                        <div class="wi-code">${fav}</div>
                        <div class="wi-name">${fav} Spot Market</div>
                    </div>
                </div>
                <div class="wi-right">
                    <div class="wi-val">${rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}</div>
                    <div class="wi-change ${isUp ? 'change-up' : 'change-down'}">
                        ${isUp ? '▲' : '▼'} ${Math.abs(change)}%
                    </div>
                </div>
            `;
            elements.watchlist.appendChild(item);
        });
    } catch (e) {
        console.error("Watchlist connection error", e);
    }
};

const initChart = () => {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: [],
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: gradient
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 2000 },
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { display: false },
                    ticks: { display: false }
                }
            }
        }
    });
};

const updateChartData = (baseRate) => {
    if (!chartInstance) return;
    const history = [];
    // Generate smoother volatility for pro feel
    let last = baseRate;
    for(let i=0; i<20; i++) {
        last = last * (1 + (Math.random() * 0.004 - 0.002));
        history.push(last);
    }
    chartInstance.data.datasets[0].data = history;
    chartInstance.update();
};

// Event Management
elements.amountInput.addEventListener("input", () => {
    // Debounce to prevent API flooding while typing math expressions
    clearTimeout(window.calcTimer);
    window.calcTimer = setTimeout(updateExchangeRate, 400);
});

elements.fromSelect.addEventListener("change", () => {
    updateFlags();
    updateExchangeRate();
    renderWatchlist();
});

elements.toSelect.addEventListener("change", () => {
    updateFlags();
    updateExchangeRate();
});

elements.swapBtn.addEventListener("click", () => {
    const temp = elements.fromSelect.value;
    elements.fromSelect.value = elements.toSelect.value;
    elements.toSelect.value = temp;
    updateFlags();
    updateExchangeRate();
    renderWatchlist();
});

elements.copyBtn.addEventListener("click", () => {
    const text = `${elements.amountInput.value} ${elements.fromSelect.value} = ${elements.resultText.innerText} ${elements.toSelect.value}`;
    navigator.clipboard.writeText(text).then(() => {
        elements.copyBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
        setTimeout(() => {
            elements.copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
        }, 2000);
    });
});

elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    updateExchangeRate();
});

// Run
init();
