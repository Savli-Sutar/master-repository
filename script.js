// REPLACE THIS URL with your actual Teachable Machine Model link!
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/"; 

let model, webcam, labelContainer, maxPredictions;
let wasteLog = [];
let lastDetected = "";

const disposalData = {
    "Plastic": {
        rules: ["• Rinse containers to remove food liquid.", "• Remove caps and recycle them separately.", "• Squash bottles to save bin space.", "• Check for recycling symbols #1, #2, or #5."],
        note: "⚠️ Heavily greased plastics should go to general waste."
    },
    "Organic": {
        rules: ["• Remove plastic stickers from fruit peels.", "• Drain excess liquids before disposal.", "• Do not include plastic bags or metal ties."],
        note: "🧁 Special Case: Used cupcake liners and pizza boxes are organic, not paper!"
    },
    "Paper": {
        rules: ["• Ensure paper is dry and free of food stains.", "• Remove any plastic windows from envelopes.", "• Flatten cardboard boxes completely."],
        note: "⚠️ If paper is wet or greasy, it belongs in Organic waste."
    },
    "Metal": {
        rules: ["• Rinse cans to remove residue.", "• Push sharp lids inside the can safely.", "• Scrunch clean aluminium foil into a ball."],
        note: "⚠️ Batteries and electronics go to e-waste centers, not this bin!"
    },
    "Glass": {
        rules: ["• Rinse out jars and bottles thoroughly.", "• Remove metal or plastic lids.", "• Do not break glass before disposal."],
        note: "⚠️ Mirrors and light bulbs are NOT recyclable glass."
    }
};

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>Loading Camera...</p>";
    
    try {
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
    } catch (e) {
        document.getElementById("webcam-container").innerHTML = "<p style='color:red; padding: 20px;'>Error: Camera or Model failed. Ensure URL is correct and Camera is Allowed.</p>";
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
        noteBox.innerText = data.note;
        noteBox.style.display = "block";
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
