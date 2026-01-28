function fillBin(binNo) {

    var statusText = document.getElementById("bin" + binNo);
    var progressBar = document.getElementById("fill" + binNo);

    if (statusText.innerText === "AI Status: Empty") {
        statusText.innerText = "AI Status: Half Filled";
        statusText.style.color = "orange";
        progressBar.style.width = "50%";
    }
    else if (statusText.innerText === "AI Status: Half Filled") {
        statusText.innerText = "AI Status: Full";
        statusText.style.color = "red";
        progressBar.style.width = "100%";
        alert("AI Alert: Bin is Full!");
    }
    else {
        statusText.innerText = "AI Status: Empty";
        statusText.style.color = "green";
        progressBar.style.width = "0%";
    }
}
const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/";
let model, webcam, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true; 
    webcam = new tmImage.Webcam(300, 300, flip); 
    await webcam.setup(); 
    await webcam.play();
    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
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
        const classPrediction = prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(0) + "%";
        labelContainer.childNodes[i].innerHTML = classPrediction;

        // AUTOMATION: If AI sees "Plastic" or "Organic" with 95% confidence, it fills the bin!
        if (prediction[i].probability > 0.95) {
            if (prediction[i].className === "Plastic") {
                fillBin(1); // Trigger Bin 1
            } else if (prediction[i].className === "Organic") {
                fillBin(2); // Trigger Bin 2
            }
        }
    }
}
let wasteLog = []; // Array to store every scan
let lastDetected = ""; 

const disposalData = {
    "Plastic": ["Rinse it", "Remove caps", "Flatten bottle"],
    "Organic": ["No plastic bags", "Remove stickers", "Drain liquids"],
    "Metal": ["Rinse cans", "Remove labels", "Check for sharp edges"]
};

// ... keep your init() and loop() functions from before ...

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        labelContainer.childNodes[i].innerHTML = `${p.className}: ${(p.probability * 100).toFixed(0)}%`;

        // Logic: Trigger if probability > 95% and it's a new item
        if (p.probability > 0.95 && lastDetected !== p.className) {
            lastDetected = p.className;
            
            // 1. Log the data
            const timestamp = new Date().toLocaleString();
            wasteLog.push({
                Time: timestamp,
                Type: p.className,
                Confidence: (p.probability * 100).toFixed(0) + "%"
            });

            // 2. Show Pop-up
            showDisposalGuide(p.className);
            
            // 3. Update Dashboard Bins
            if (p.className === "Plastic") fillBin(1);
            if (p.className === "Organic") fillBin(2);
        }
    }
}

function showDisposalGuide(type) {
    const modal = document.getElementById("disposalModal");
    const list = document.getElementById("disposalList");
    document.getElementById("wasteTitle").innerText = type + " Disposal Guide";
    
    list.innerHTML = "";
    (disposalData[type] || ["Dispose in general waste"]).forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        list.appendChild(li);
    });
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 3000); // Cool down before next scan
}

// Function to download the log as a CSV file
function downloadReport() {
    if (wasteLog.length === 0) {
        alert("No data collected yet!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Time,Waste Type,Confidence\n";
    wasteLog.forEach(row => {
        csvContent += `${row.Time},${row.Type},${row.Confidence}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Waste_Management_Report.csv");
    document.body.appendChild(link);
    link.click();
}


