// Flux Intelligence Engine
const baseURL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

// Element Selection
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
    copyBtn: document.querySelector(".copy-btn")
};

let chartInstance = null;

// initialization
const init = async () => {
    populateSelects();
    updateFlags();
    await updateExchangeRate();
    renderWatchlist();
    initChart();
};

const populateSelects = () => {
    Object.keys(countryList).forEach(curr => {
        const opt1 = new Option(curr, curr);
        const opt2 = new Option(curr, curr);
        if (curr === "USD") opt1.selected = true;
        if (curr === "PKR") opt2.selected = true;
        elements.fromSelect.add(opt1);
        elements.toSelect.add(opt2);
    });
};

const updateFlags = () => {
    elements.fromFlag.src = `https://flagsapi.com/${countryList[elements.fromSelect.value]}/flat/64.png`;
    elements.toFlag.src = `https://flagsapi.com/${countryList[elements.toSelect.value]}/flat/64.png`;
};

// Math Engine
const evaluateExpression = (str) => {
    try {
        // Basic safety: only allow numbers and operators
        const cleanStr = str.replace(/[^-+*/%0-9.]/g, '');
        return Function(`'use strict'; return (${cleanStr})`)();
    } catch {
        return null;
    }
};

const updateExchangeRate = async () => {
    let rawVal = elements.amountInput.value.replace(/,/g, '');
    let amt = evaluateExpression(rawVal);
    
    if (amt === null || isNaN(amt)) {
        amt = 1;
    }

    elements.calcHint.innerText = amt !== parseFloat(rawVal) ? `= ${amt.toLocaleString()}` : "";
    
    try {
        const from = elements.fromSelect.value.toLowerCase();
        const to = elements.toSelect.value.toLowerCase();
        
        elements.convertBtn.innerHTML = `Analyzing...`;
        
        const response = await fetch(`${baseURL}/${from}.json`);
        const data = await response.json();
        const rate = data[from][to];
        
        const total = (amt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
        
        elements.resultText.innerText = total;
        elements.toLabel.innerText = elements.toSelect.value;
        elements.rateText.innerText = `1 ${elements.fromSelect.value} = ${rate.toFixed(4)} ${elements.toSelect.value}`;
        
        // Update Chart with fake volatility for demo
        updateChartData(rate);
        
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        elements.convertBtn.innerHTML = `<span>Check Performance</span> <i class="fa-solid fa-arrow-right"></i>`;
    }
};

// Market Watch Logic
const renderWatchlist = async () => {
    const favorites = ["EUR", "GBP", "JPY", "CNY", "SAR"];
    elements.watchlist.innerHTML = "";
    
    try {
        const base = elements.fromSelect.value.toLowerCase();
        const res = await fetch(`${baseURL}/${base}.json`);
        const data = await res.json();
        const rates = data[base];

        favorites.forEach(fav => {
            const rate = rates[fav.toLowerCase()];
            const change = (Math.random() * 2 - 1).toFixed(2); // Mock change
            const isUp = change >= 0;

            const item = document.createElement("div");
            item.className = "watch-item";
            item.innerHTML = `
                <div class="wi-left">
                    <img src="https://flagsapi.com/${countryList[fav]}/flat/64.png" class="wi-flag">
                    <div>
                        <div class="wi-code">${fav}</div>
                        <div class="wi-name">${fav} Market</div>
                    </div>
                </div>
                <div class="wi-right">
                    <div class="wi-val">${rate.toFixed(2)}</div>
                    <div class="wi-change ${isUp ? 'change-up' : 'change-down'}">
                        ${isUp ? '▲' : '▼'} ${Math.abs(change)}%
                    </div>
                </div>
            `;
            elements.watchlist.appendChild(item);
        });
    } catch (e) {
        console.error("Watchlist error", e);
    }
};

// Chart.js implementation
const initChart = () => {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(12).fill(''),
            datasets: [{
                label: 'Trend',
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
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { display: false }
                }
            }
        }
    });
};

const updateChartData = (baseRate) => {
    if (!chartInstance) return;
    // Generate mock history based on current rate
    const history = [];
    for(let i=0; i<12; i++) {
        history.push(baseRate * (1 + (Math.random() * 0.02 - 0.01)));
    }
    chartInstance.data.datasets[0].data = history;
    chartInstance.update();
};

// Event Listeners
elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    updateExchangeRate();
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
    navigator.clipboard.writeText(text);
    elements.copyBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
    setTimeout(() => {
        elements.copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
    }, 2000);
});

// Auto-evaluate on input
elements.amountInput.addEventListener("input", (e) => {
    // Basic formatting for number readability
    let val = e.target.value;
    if (!isNaN(val) && val !== "") {
        // Optional: formatting logic
    }
    updateExchangeRate();
});

// Start
init();
