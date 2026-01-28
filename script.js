const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/";
let model, webcam, labelContainer, maxPredictions;
let wasteLog = [];
let lastDetected = "";

const disposalData = {
    "Plastic": ["Rinse residues", "Remove bottle caps", "Flatten to save space"],
    "Organic": ["No plastic wraps", "Remove fruit stickers", "Ideal for composting"],
    "Paper": ["Must be dry", "Remove plastic tape", "Flatten cardboard"],
    "Metal": ["Clean food cans", "Recycle foil separately", "Check for sharp edges"]
};

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>Loading AI Model...</p>";
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(300, 300, true);
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
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        labelContainer.childNodes[i].innerHTML = `<b>${p.className}:</b> ${(p.probability * 100).toFixed(0)}%`;

        if (p.probability > 0.95 && lastDetected !== p.className) {
            lastDetected = p.className;
            
            // Log for report
            wasteLog.push({ time: new Date().toLocaleTimeString(), type: p.className });

            // Trigger Pop-up
            showDisposalGuide(p.className);

            // Auto-update Bins
            if (p.className.includes("Plastic")) fillBin(1);
            if (p.className.includes("Organic")) fillBin(2);
        }
    }
}

function fillBin(binNo) {
    const status = document.getElementById("bin" + binNo);
    const fill = document.getElementById("fill" + binNo);

    if (status.innerText.includes("Empty")) {
        status.innerText = "AI Status: Half Filled";
        status.style.color = "orange";
        fill.style.width = "50%";
    } else {
        status.innerText = "AI Status: Full";
        status.style.color = "red";
        fill.style.width = "100%";
    }
}

function showDisposalGuide(type) {
    const modal = document.getElementById("disposalModal");
    document.getElementById("wasteTitle").innerText = type + " Disposal Guide";
    const list = document.getElementById("disposalList");
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
    setTimeout(() => { lastDetected = ""; }, 5000); // Cool down
}

function downloadReport() {
    if (wasteLog.length === 0) return alert("No data yet!");
    let csv = "Time,Waste Type\n" + wasteLog.map(r => `${r.time},${r.type}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Waste_Report.csv';
    a.click();
}
