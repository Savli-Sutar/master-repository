const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/"; 

let model, webcam, labelContainer, maxPredictions;
let lastDetected = "";

const disposalData = {
    "Plastic": {
        rules: ["• Rinse containers.", "• Remove caps.", "• Squash bottles."],
        note: "⚠️ Greasy plastic (oil bottles) go to General Waste."
    },
    "Organic": {
        rules: ["• No plastic bags.", "• Drain liquids.", "• Remove stickers."],
        note: "🧁 Special Case: Greasy cupcake liners belong here!"
    },
    "Paper": {
        rules: ["• Keep it dry.", "• Flatten boxes.", "• Remove tape."],
        note: "⚠️ Greasy pizza boxes belong in Organic."
    },
    "Metal": {
        rules: ["• Rinse cans.", "• Push lids inside.", "• No electronics."],
        note: "⚠️ Batteries are e-waste! Do not put them here."
    },
    "Glass": {
        rules: ["• Rinse jars.", "• Remove metal lids.", "• Do not break."],
        note: "⚠️ Light bulbs and mirrors are NOT recyclable glass."
    }
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
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    // BACKUP: Re-select labelContainer if it's lost
    if(!labelContainer) labelContainer = document.getElementById("label-container");
    
    labelContainer.innerHTML = ""; // Clear the box

    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        const percent = (p.probability * 100).toFixed(0);
        
        // Directly creating the probability text
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.color = "#2e8b57";
        row.style.marginBottom = "2px";
        row.innerHTML = `<span>${p.className}:</span> <strong>${percent}%</strong>`;
        labelContainer.appendChild(row);

        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
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
    list.innerHTML = "";
    data.rules.forEach(r => {
        let li = document.createElement("li");
        li.innerText = r;
        list.appendChild(li);
    });
    document.getElementById("specialNote").innerText = data.note;
    document.getElementById("disposalModal").style.display = "block";
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    if(!labelContainer) labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; 

    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        const percent = (p.probability * 100).toFixed(0);
        
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.color = "#2e8b57";
        row.style.marginBottom = "2px";
        row.innerHTML = `<span>${p.className}:</span> <strong>${percent}%</strong>`;
        labelContainer.appendChild(row);

        // TRIGGER ACTION: If over 90% and it's a new item
        if (p.probability > 0.90 && lastDetected !== p.className) {
            lastDetected = p.className;
            showModal(p.className);
            updateBins(p.className); // This calls the function below
        }
    }
}

function updateBins(type) {
    // We convert everything to lowercase to avoid "Plastic" vs "plastic" errors
    const name = type.toLowerCase();
    let id = 0;

    if (name.includes("plastic")) id = 1;
    else if (name.includes("organic")) id = 2;
    else if (name.includes("paper")) id = 3;
    else if (name.includes("metal")) id = 4;
    else if (name.includes("glass")) id = 5;

    if (id > 0) {
        const status = document.getElementById("bin" + id);
        const fill = document.getElementById("fill" + id);
        
        // Update the visual bin
        fill.style.width = "100%";
        status.innerText = "AI Status: Full";
        status.style.color = "red";
        status.style.fontWeight = "bold";
        
        console.log("Updated Bin ID: " + id); // This helps you debug in the F12 console
    }
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 3000);
}

