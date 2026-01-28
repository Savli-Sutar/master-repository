// 1. Model Configuration
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/";
let model, webcam, labelContainer, maxPredictions;
let wasteLog = []; // Array to store detections for the report

// 2. Initialize the AI and Camera
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Show loading state
    document.getElementById("webcam-container").innerHTML = "<h3>Loading AI Model...</h3>";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const flip = true; 
        webcam = new tmImage.Webcam(400, 400, flip); 
        
        await webcam.setup(); 
        await webcam.play();
        window.requestAnimationFrame(loop);

        document.getElementById("webcam-container").innerHTML = ""; 
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = ""; 
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    } catch (e) {
        console.error(e);
        alert("Camera Error: Please ensure you are using HTTPS and have allowed camera access.");
    }
}

async function loop() {
    webcam.update(); 
    await predict();
    window.requestAnimationFrame(loop);
}

// 3. AI Prediction Logic
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability.toFixed(2);
        const percent = Math.round(probability * 100);
        
        // Update labels with the special probability font
        labelContainer.childNodes[i].innerHTML = `
            <span>${className}:</span> 
            <span class="probability-font">${percent}%</span>
        `;

        // Action if detection is over 85%
        if (probability > 0.85) {
            updateBinUI(className);
            logWaste(className, percent);
        }
    }
}

// 4. UI Update Logic
function updateBinUI(wasteType) {
    const bins = {
        "Plastic": { id: "bin1", fill: "fill1" },
        "Organic": { id: "bin2", fill: "fill2" },
        "Paper": { id: "bin3", fill: "fill3" },
        "Metal": { id: "bin4", fill: "fill4" },
        "Glass": { id: "bin5", fill: "fill5" }
    };

    if (bins[wasteType]) {
        const bin = bins[wasteType];
        document.getElementById(bin.id).innerHTML = `AI Status: <strong>${wasteType} Identified</strong>`;
        document.getElementById(bin.fill).style.width = "100%";
        document.getElementById(bin.fill).style.backgroundColor = "#2ecc71";
    }
}

// 5. Logging & Reports
function logWaste(type, confidence) {
    const time = new Date().toLocaleTimeString();
    // Only log if the waste type is different from the last one to avoid spam
    if (wasteLog.length === 0 || wasteLog[wasteLog.length - 1].type !== type) {
        wasteLog.push({ time, type, confidence: confidence + "%" });
    }
}

function downloadReport() {
    if (wasteLog.length === 0) {
        alert("No data recorded yet!");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Time,Waste Type,Confidence\n";
    wasteLog.forEach(row => {
        csvContent += `${row.time},${row.type},${row.confidence}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Waste_Log_Report.csv");
    document.body.appendChild(link);
    link.click();
}

// 6. IoT Alert Simulation
function simulateFullBin() {
    const randomBin = Math.floor(Math.random() * 5) + 1;
    document.getElementById(`fill${randomBin}`).style.backgroundColor = "#e74c3c";
    document.getElementById(`bin${randomBin}`).innerHTML = "⚠️ STATUS: FULL - ALERT SENT";
    alert(`IoT Notification: Bin ${randomBin} is full. Alert dispatched to central server.`);
}
