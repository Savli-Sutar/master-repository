// 1. CONFIGURATION & STATE
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/"; 
let model, webcam, labelContainer, maxPredictions, ecoChart;
let lastDetected = "";
let currentDetectedType = "";

// Load stats from LocalStorage (keeps data after refresh)
let points = parseInt(localStorage.getItem("ecoPoints") || 0);
let empties = parseInt(localStorage.getItem("emptyCount") || 0);

// Disposal Rules Database
const disposalData = {
    "Plastic": { rules: ["• Rinse containers.", "• Remove caps.", "• Squash bottles."], note: "⚠️ No oil bottles!" },
    "Organic": { rules: ["• No plastic bags.", "• Drain liquids.", "• Remove stickers."], note: "🧁 Greasy liners are OK." },
    "Paper": { rules: ["• Keep it dry.", "• Flatten boxes.", "• Remove tape."], note: "⚠️ No greasy pizza boxes." },
    "Metal": { rules: ["• Rinse cans.", "• Push lids inside."], note: "⚠️ No electronics!" },
    "Glass": { rules: ["• Rinse jars.", "• Remove metal lids."], note: "⚠️ No mirrors or bulbs." }
};

// 2. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    initChart();
    loadErrorLog();
});

async function init() {
    const container = document.getElementById("webcam-container");
    container.innerHTML = "<p style='color:white; padding-top:140px;'>Connecting AI...</p>";
    
    try {
        model = await tmImage.load(URL + "model.json", URL + "metadata.json");
        maxPredictions = model.getTotalClasses();

        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
    } catch (error) {
        container.innerHTML = "<p style='color:red;'>Error loading camera. Check permissions.</p>";
        console.error(error);
    }
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
        
        // Show probabilities in the UI
        const row = document.createElement("div");
        row.style.fontSize = "12px";
        row.innerHTML = `${p.className}: ${(p.probability * 100).toFixed(0)}%`;
        labelContainer.appendChild(row);

        // Trigger detection at 90% confidence
        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
            currentDetectedType = p.className;
            showModal(p.className);
            updateBins(p.className);
        }
    }
}

// 4. UI & BIN ACTIONS
function showModal(type) {
    const data = disposalData[type];
    if (!data) return;

    document.getElementById("wasteTitle").innerText = type + " Detected";
    const list = document.getElementById("disposalList");
    list.innerHTML = data.rules.map(r => `<li>${r}</li>`).join("");
    document.getElementById("specialNote").innerText = data.note;
    document.getElementById("disposalModal").style.display = "block";
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
        const fill = document.getElementById("fill" + id);
        const status = document.getElementById("bin" + id);
        if (fill) fill.style.width = "100%";
        if (status) {
            status.innerText = "Status: Full";
            status.style.color = "red";
        }
    }
}

function resetAllBins() {
    for (let i = 1; i <= 5; i++) {
        const fill = document.getElementById("fill" + i);
        const status = document.getElementById("bin" + i);
        if (fill) fill.style.width = "0%";
        if (status) {
            status.innerText = "Status: Empty";
            status.style.color = "#333";
        }
    }
    empties++;
    localStorage.setItem("emptyCount", empties);
    updateDisplay();
    lastDetected = ""; // Clear memory so AI can re-scan
    alert("Bins emptied! Your progress has been logged.");
}

// 5. STATS & ERRORS
function confirmDisposal() {
    points += 10;
    localStorage.setItem("ecoPoints", points);
    updateDisplay();
    closeModal();
}

function reportError() {
    let errors = JSON.parse(localStorage.getItem("errorLog") || "[]");
    errors.push(`❌ Misidentified ${currentDetectedType} (${new Date().toLocaleTimeString()})`);
    localStorage.setItem("errorLog", JSON.stringify(errors));
    loadErrorLog();
    alert("Error recorded in the refinement log. Please sort manually.");
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
    // Short delay before AI can trigger the same item again
    setTimeout(() => { lastDetected = ""; }, 3000);
}

function updateDisplay() {
    if (document.getElementById("eco-points")) document.getElementById("eco-points").innerText = points;
    if (document.getElementById("empty-count")) document.getElementById("empty-count").innerText = empties;
}

// 6. CHARTING
function initChart() {
    const ctx = document.getElementById('ecoChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{ 
                label: 'Points', 
                data: [0, 0, 0, 0, 0, 0, points], 
                borderColor: '#2e8b57',
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });
}
