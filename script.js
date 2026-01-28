const URL = "https://teachablemachine.withgoogle.com/models/qzbWj1b7y/"; 

let model, webcam, labelContainer, maxPredictions;
let lastDetected = "";

const disposalData = {
    "Plastic": {
        rules: ["• Rinse containers.", "• Remove caps.", "• Squash bottles."],
        note: "⚠️ Greasy plastic goes to General Waste."
    },
    "Organic": {
        rules: ["• No plastic bags.", "• Drain liquids.", "• Remove stickers."],
        note: "🧁 Special Case: Cupcake liners belong here!"
    },
    "Paper": {
        rules: ["• Keep it dry.", "• Flatten boxes.", "• Remove tape."],
        note: "⚠️ Greasy pizza boxes belong in Organic."
    },
    "Metal": {
        rules: ["• Rinse cans.", "• Push lids inside.", "• No electronics."],
        note: "⚠️ Batteries are e-waste!"
    },
    "Glass": {
        rules: ["• Rinse jars.", "• Remove metal lids.", "• Do not break."],
        note: "⚠️ Light bulbs are NOT recyclable glass."
    }
};

async function init() {
    document.getElementById("webcam-container").innerHTML = "<p style='color:white; padding-top:140px;'>Loading AI...</p>";
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
    for (let i = 0; i < maxPredictions; i++) {
        const p = prediction[i];
        if (p.probability > 0.92 && lastDetected !== p.className) {
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

function updateBins(type) {
    const map = {"Plastic": 1, "Organic": 2, "Paper": 3, "Metal": 4, "Glass": 5};
    const id = map[type];
    if (id) {
        document.getElementById("fill" + id).style.width = "100%";
        document.getElementById("bin" + id).innerText = "AI Status: Full";
        document.getElementById("bin" + id).style.color = "red";
    }
}

function closeModal() {
    document.getElementById("disposalModal").style.display = "none";
    setTimeout(() => { lastDetected = ""; }, 3000);
}
