const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/";
let model, webcam, labelContainer, maxPredictions;
let wasteLog = [];
let lastDetected = "";

const disposalData = {
    "Plastic": ["Rinse residues", "Remove caps", "Flatten bottle"],
    "Organic": ["No plastic bags", "Remove stickers", "Compost if possible"],
    "Paper": ["Keep dry", "Remove tape", "Flatten cardboard boxes"],
    "Metal": ["Clean food cans", "Recycle clean foil", "Check for sharp edges"]
};

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>AI Loading...</p>";
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
            wasteLog.push({ time: new Date().toLocaleTimeString(), type: p.className });

            showDisposalGuide(p.className);

            // Auto-trigger bins based on class name
            const name = p.className.toLowerCase();
            if (name.includes("plastic")) fillBin(1);
            else if (name.includes("organic")) fillBin(2);
            else if (name.includes("paper")) fillBin(3);
            else if (name.includes("metal")) fillBin(4);
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
    (disposalData[type] || ["Place in proper bin"]).forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        list.appendChild(li);
    });
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 5000); // Wait 5s before same item scan
}

function downloadReport() {
    if (wasteLog.length === 0) return alert("No scans yet!");
    let csv = "Time,Waste Type\n" + wasteLog.map(r => `${r.time},${r.type}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Waste_Report.csv';
    a.click();
}
