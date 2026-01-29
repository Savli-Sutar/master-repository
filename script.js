// 1. CONFIGURATION & STATE
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/"; 
let model, webcam, labelContainer, maxPredictions;
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

        // Threshold of 90% accuracy to trigger bin/modal
        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
            currentDetectedType = p.className;
            showModal(p.className);
            updateBins(p.className);
        }
    }
}

// 4. HABIT & STATS LOGIC
function checkStreak() {
    const lastDate = localStorage.getItem("lastScanDate");
    const today = new Date().toDateString();
    let streak = parseInt(localStorage.getItem("scanStreak") || 0);

    if (lastDate !== today) {
        // If yesterday was the last scan, increment. If not, reset to 1.
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === yesterday.toDateString()) {
            streak++;
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

// 5. UI ACTIONS (Modals & Bins)
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
    points += (pointValues[currentDetectedType] || 0);
    localStorage.setItem("ecoPoints", points);
    
    // Check streak again on every scan to ensure it's recorded
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

// 6. SYSTEM MAINTENANCE
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
    const errorEntry = `Misidentified ${currentDetectedType} (${new Date().toLocaleTimeString()})`;
    errors.push(errorEntry);
    localStorage.setItem("errorLog", JSON.stringify(errors));
    loadErrorLog();
    alert("Logged! Please add more " + currentDetectedType + " images to your training data.");
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
    // Short delay before AI resumes detection to prevent instant re-trigger
    setTimeout(() => { lastDetected = ""; }, 3000);
}
