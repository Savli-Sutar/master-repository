const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/";
let model, webcam, labelContainer, maxPredictions;
let wasteLog = []; 

// Disposal Instructions Data
const disposalGuide = {
    "Plastic": ["Rinse bottles", "Remove caps", "Crush to save space"],
    "Organic": ["No plastic bags", "Includes food scraps", "Compost if possible"],
    "Paper": ["Keep it dry", "Fold boxes flat", "Remove oily parts"],
    "Metal": ["Wash cans", "Separate lids", "Recycle foil separately"],
    "Glass": ["Rinse jars", "Do not break", "Remove metal caps"]
};

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true; 
    webcam = new tmImage.Webcam(350, 350, flip); 
    await webcam.setup(); 
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        
        // Probability Font Update
        labelContainer.childNodes[i].innerHTML = `
            ${className}: <span class="probability-font">${probability}%</span>
        `;

        if (prediction[i].probability > 0.85) {
            updateDashboard(className);
        }
    }
}

function updateDashboard(type) {
    const guideBox = document.getElementById("disposal-guide");
    const list = document.getElementById("guide-list");
    const title = document.getElementById("guide-title");

    // Show Guide
    if (disposalGuide[type]) {
        guideBox.style.display = "block";
        title.innerText = `Instructions for ${type}:`;
        list.innerHTML = disposalGuide[type].map(item => `<li>${item}</li>`).join("");
    }

    // Log data
    const now = new Date().toLocaleTimeString();
    if (wasteLog.length === 0 || wasteLog[wasteLog.length - 1].type !== type) {
        wasteLog.push({ time: now, type: type });
    }
}

function downloadReport() {
    if (wasteLog.length === 0) return alert("Log is empty!");
    
    let csv = "Time,Waste Type\n";
    wasteLog.forEach(row => { csv += `${row.time},${row.type}\n`; });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Waste_Report.csv";
    a.click();
}

function simulateFullBin() {
    const binNum = Math.floor(Math.random() * 5) + 1;
    document.getElementById(`fill${binNum}`).style.width = "100%";
    document.getElementById(`fill${binNum}`).style.backgroundColor = "red";
    document.getElementById(`bin${binNum}`).innerText = "⚠️ BIN FULL - ALERT SENT";
}
