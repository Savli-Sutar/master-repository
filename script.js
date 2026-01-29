// 1. CONFIGURATION & STATE
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/"; 
let model, webcam, labelContainer, maxPredictions, ecoChart;
let lastDetected = "";
let currentDetectedType = "";

// Global Stats (Loaded from LocalStorage)
let points = parseInt(localStorage.getItem("ecoPoints") || 0);
let empties = parseInt(localStorage.getItem("emptyCount") || 0);

const disposalData = {
    "Plastic": { rules: ["• Rinse containers.", "• Remove caps.", "• Squash bottles."], note: "⚠️ No oil bottles!", color: "#3498db" },
    "Organic": { rules: ["• No plastic bags.", "• Drain liquids.", "• Remove stickers."], note: "🧁 Greasy liners are OK.", color: "#2ecc71" },
    "Paper": { rules: ["• Keep it dry.", "• Flatten boxes.", "• Remove tape."], note: "⚠️ No greasy pizza boxes.", color: "#f1c40f" },
    "Metal": { rules: ["• Rinse cans.", "• Push lids inside."], note: "⚠️ No electronics!", color: "#95a5a6" },
    "Glass": { rules: ["• Rinse jars.", "• Remove metal lids."], note: "⚠️ No mirrors or bulbs.", color: "#9b59b6" }
};

// 2. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    checkStreak();
    loadErrorLog();
    initChart();
});

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>Loading AI...</p>";
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(300, 300, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// 3. AI PREDICTION LOGIC
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    labelContainer.innerHTML = ""; 
    
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        const percent = (p.probability * 100).toFixed(0);
        
        const row = document.createElement("div");
        row.className = "prob-row";
        row.innerHTML = `<span>${p.className}:</span> <strong>${percent}%</strong>`;
        labelContainer.appendChild(row);

        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
            currentDetectedType = p.className;
            showModal(p.className);
            updateBins(p.className);
        }
    }
}

// 4. CHART.JS LOGIC
function initChart() {
    const ctx = document.getElementById('ecoChart').getContext('2d');
    const weeklyData = JSON.parse(localStorage.getItem("weeklyPoints") || "[0, 0, 0, 0, 0, 0, 0]");

    ecoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Eco-Points Growth',
                data: weeklyData,
                borderColor: '#2e8b57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateWeeklyData(earnedPoints) {
    let data = JSON.parse(localStorage.getItem("weeklyPoints") || "[0, 0, 0, 0, 0, 0, 0]");
    let dayIndex = new Date().getDay(); 
    let adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Adjust Sunday from 0 to 6
    
    data[adjustedIndex] += earnedPoints;
    localStorage.setItem("weeklyPoints", JSON.stringify(data));
    
    ecoChart.data.datasets[0].data = data;
    ecoChart.update();
}

// 5. HABIT & STATS LOGIC
function checkStreak() {
    const lastDate = localStorage.getItem("lastScanDate");
    const today = new Date().toDateString();
    let streak = parseInt(localStorage.getItem("scanStreak") || 0);

    if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === yesterday.toDateString()) {
            streak++;
        } else if (!lastDate) {
            streak = 1;
        } else {
            streak = 1; 
        }
        localStorage.setItem("scanStreak", streak);
        localStorage.setItem("lastScanDate", today);
    }
    updateDisplay();
}

function updateDisplay() {
    document.getElementById("eco-points").innerText = points;
    document.getElementById("empty-count").innerText = empties;
    document.getElementById("streak-count").innerText = localStorage.getItem("scanStreak") || 0;
}

// 6. UI ACTIONS
function showModal(type) {
    const data = disposalData[type];
    if (!data) return;
    document.getElementById("wasteTitle").innerText = type + " Detected";
    const list = document.getElementById("disposalList");
    list.innerHTML = "";
    data.rules.forEach(r => {
        let li = document.createElement("li");
        li.innerText = r;
        list.appendChild(li);
    });
    document.getElementById("specialNote").innerText = data.note;
    document.getElementById("disposalModal").style.display = "block";
}

function confirmDisposal() {
    const pointValues = { "Plastic": 10, "Organic": 5, "Paper": 5, "Metal": 10, "Glass": 10 };
    const earned = (pointValues[currentDetectedType] || 0);
    
    points += earned;
    localStorage.setItem("ecoPoints", points);
    updateWeeklyData(earned);
    
    localStorage.setItem("lastScanDate", new Date().toDateString());
    updateDisplay();
    closeModal();
}

function updateBins(type) {
    const name = type.toLowerCase().trim();
    let id = 0;
    if (name.includes("plastic")) id = 1;
    else if (name.includes("organic")) id = 2;
    else if (name.includes("paper")) id = 3;
    else if (name.includes("metal")) id = 4;
    else if (name.includes("glass")) id = 5;

    if (id > 0) {
        document.getElementById("fill" + id).style.width = "100%";
        const status = document.getElementById("bin" + id);
        status.innerText = "AI Status: Full";
        status.style.color = "red";
    }
}

function resetAllBins() {
    for (let i = 1; i <= 5; i++) {
        document.getElementById("fill" + i).style.width = "0%";
        document.getElementById("bin" + i).innerText = "AI Status: Empty";
        document.getElementById("bin" + i).style.color = "black";
    }
    empties++;
    localStorage.setItem("emptyCount", empties);
    updateDisplay();
    lastDetected = "";
}

function reportError() {
    let errors = JSON.parse(localStorage.getItem("errorLog") || "[]");
    const errorEntry = `❌ Misidentified ${currentDetectedType} (${new Date().toLocaleTimeString()})`;
    errors.push(errorEntry);
    localStorage.setItem("errorLog", JSON.stringify(errors));
    loadErrorLog();
    alert("Error recorded in the refinement log.");
    closeModal();
}

function loadErrorLog() {
    const list = document.getElementById("error-list");
    if (!list) return;
    const errors = JSON.parse(localStorage.getItem("errorLog") || "[]");
    list.innerHTML = errors.slice(-3).map(e => `<li>${e}</li>`).join("");
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 3000);
}
