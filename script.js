const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/"; 
let model, webcam, labelContainer, maxPredictions, ecoChart;
let lastDetected = "";
let currentDetectedType = "";

let points = parseInt(localStorage.getItem("ecoPoints") || 0);
let empties = parseInt(localStorage.getItem("emptyCount") || 0);

const disposalData = {
    "Plastic": { rules: ["• Rinse containers.", "• Remove caps.", "• Squash bottles."], note: "⚠️ No oil bottles!" },
    "Organic": { rules: ["• No plastic bags.", "• Drain liquids."], note: "🧁 Greasy liners are OK." },
    "Paper": { rules: ["• Keep it dry.", "• Flatten boxes."], note: "⚠️ No greasy pizza boxes." },
    "Metal": { rules: ["• Rinse cans.", "• Push lids inside."], note: "⚠️ No electronics!" },
    "Glass": { rules: ["• Rinse jars.", "• Remove lids."], note: "⚠️ No mirrors or bulbs." }
};

document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    initChart();
});

async function init() {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxPredictions = model.getTotalClasses();
    webcam = new tmImage.Webcam(300, 300, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
            currentDetectedType = p.className;
            showModal(p.className);
            updateBins(p.className);
        }
    }
}

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
    const name = type.toLowerCase();
    let id = 0;
    if (name.includes("plastic")) id = 1;
    else if (name.includes("organic")) id = 2;
    else if (name.includes("paper")) id = 3;
    else if (name.includes("metal")) id = 4;
    else if (name.includes("glass")) id = 5;

    if (id > 0) {
        document.getElementById("fill" + id).style.width = "100%";
        document.getElementById("bin" + id).innerText = "Status: Full";
        document.getElementById("bin" + id).style.color = "red";
    }
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 3000);
}

function confirmDisposal() {
    points += 10;
    localStorage.setItem("ecoPoints", points);
    updateDisplay();
    closeModal();
}

function updateDisplay() {
    document.getElementById("eco-points").innerText = points;
}

function initChart() {
    const ctx = document.getElementById('ecoChart').getContext('2d');
    ecoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [{ label: 'Points', data: [0, 0, 0, 0, 0, 0, points], borderColor: '#2e8b57' }]
        }
    });
}
