// AI Model Configuration
const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/";
let model, webcam, labelContainer, maxPredictions;
let wasteLog = []; 
let lastDetected = ""; 

// Disposal Instructions Data
const disposalData = {
    "Plastic": ["Rinse the container", "Remove the cap", "Flatten the bottle"],
    "Organic": ["No plastic bags", "Remove stickers", "Drain excess liquids"],
    "Paper": ["Keep it dry", "Remove tape/staples", "Flatten boxes"],
    "Metal": ["Rinse food residue", "Place lids inside cans", "Recycle only clean metal"]
};

// 1. Initialize AI Model and Webcam
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Load the model
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Setup Webcam
    const flip = true; 
    webcam = new tmImage.Webcam(300, 300, flip); 
    await webcam.setup(); 
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Add webcam to the UI
    document.getElementById("webcam-container").innerHTML = ""; // Clear loading text
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // Clear old labels
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// 2. AI Prediction Logic
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        const className = p.className;
        const probability = (p.probability * 100).toFixed(0);

        labelContainer.childNodes[i].innerHTML = `${className}: ${probability}%`;

        // Logic: Trigger if confidence is > 90%
        if (p.probability > 0.90 && lastDetected !== className) {
            lastDetected = className;
            
            // Log Data for Report
            wasteLog.push({
                Time: new Date().toLocaleTimeString(),
                Type: className,
                Confidence: probability + "%"
            });

            // Show UI Effects
            showDisposalGuide(className);
            
            if (className.includes("Plastic")) fillBin(1);
            else if (className.includes("Organic")) fillBin(2);
        }
    }
}

// 3. Bin Filling Logic
function fillBin(binNo) {
    var statusText = document.getElementById("bin" + binNo);
    var progressBar = document.getElementById("fill" + binNo);

    if (statusText.innerText.includes("Empty")) {
        statusText.innerText = "AI Status: Half Filled";
        statusText.style.color = "orange";
        progressBar.style.width = "50%";
    }
    else {
        statusText.innerText = "AI Status: Full";
        statusText.style.color = "red";
        progressBar.style.width = "100%";
    }
}

// 4. Modal Pop-up Logic
function showDisposalGuide(type) {
    const modal = document.getElementById("disposalModal");
    const title = document.getElementById("wasteTitle");
    const list = document.getElementById("disposalList");

    title.innerText = type + " Disposal Instructions";
    list.innerHTML = "";

    const rules = disposalData[type] || ["Dispose in appropriate bin"];
    rules.forEach(rule => {
        let li = document.createElement("li");
        li.innerText = rule;
        list.appendChild(li);
    });

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    // Short cooldown before detecting the same item again
    setTimeout(() => { lastDetected = ""; }, 3000);
}

// 5. Download CSV Report
function downloadReport() {
    if (wasteLog.length === 0) {
        alert("No waste detected yet!");
        return;
    }
    let csv = "Time,Waste Type,Confidence\n";
    wasteLog.forEach(row => {
        csv += `${row.Time},${row.Type},${row.Confidence}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Waste_Report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
