const URL = "PASTE_YOUR_NEW_URL_HERE/"; 
let model, webcam, labelContainer, maxPredictions;
let wasteLog = [];
let lastDetected = "";

const disposalData = {
    "Plastic": {
        rules: ["Rinse residues", "Remove caps", "Flatten bottle"],
        note: "⚠️ If plastic is heavily contaminated with oil, it may not be recyclable."
    },
    "Organic": {
        rules: ["No plastic wraps", "Remove stickers", "Compost if possible"],
        note: "🧁 Special Case: Greasy cupcake liners and pizza boxes belong here!"
    },
    "Paper": {
        rules: ["Keep dry", "Remove tape", "Flatten cardboard"],
        note: "⚠️ Paper must be clean. If it's greasy or wet, move it to Organic."
    },
    "Metal": {
        rules: ["Clean food cans", "Recycle clean foil", "Check for sharp edges"],
        note: "⚠️ Ensure cans are empty to avoid attracting pests."
    },
    "Glass": {
        rules: ["Rinse jars and bottles", "Remove metal lids", "Keep glass intact"],
        note: "⚠️ Note: Mirrors and light bulbs are NOT recyclable glass."
    }
};

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>Loading Smarter AI...</p>";
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

            const name = p.className;
            if (name === "Plastic") fillBin(1);
            else if (name === "Organic") fillBin(2);
            else if (name === "Paper") fillBin(3);
            else if (name === "Metal") fillBin(4);
            else if (name === "Glass") fillBin(5);
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
    const list = document.getElementById("disposalList");
    const noteBox = document.getElementById("specialNote");
    
    document.getElementById("wasteTitle").innerText = type + " Disposal Guide";
    list.innerHTML = "";
    
    const data = disposalData[type];
    if (data) {
        data.rules.forEach(item => {
            let li = document.createElement("li");
            li.innerText = item;
            list.appendChild(li);
        });
        if (data.note) {
            noteBox.innerText = data.note;
            noteBox.style.display = "block";
        } else {
            noteBox.style.display = "none";
        }
    }
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 5000);
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
