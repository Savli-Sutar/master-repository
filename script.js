// The link to your model provided by Teachable Machine
const URL = "https://teachablemachine.withgoogle.com/models/CPn8HY5wC/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // Load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(350, 350, flip); // width, height, flip
        
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Append elements to the DOM
        document.getElementById("webcam-container").innerHTML = ""; // Clear "Loading" text
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = ""; // Clear old labels
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    } catch (e) {
        console.error(e);
        alert("Camera failed! Make sure you are using HTTPS and have granted permissions.");
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// Run the webcam image through the image model
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability.toFixed(2);
        
        labelContainer.childNodes[i].innerHTML = `${className}: ${Math.round(probability * 100)}%`;

        // Update Bin Status if confidence is high (over 80%)
        if (probability > 0.80) {
            updateBinUI(className);
        }
    }
}

function updateBinUI(wasteType) {
    // This part connects your AI labels to your HTML Bin IDs
    // Adjust 'Plastic', 'Organic', etc., to match your EXACT labels in Teachable Machine
    const bins = {
        "Plastic": { id: "bin1", fill: "fill1" },
        "Organic": { id: "bin2", fill: "fill2" },
        "Paper": { id: "bin3", fill: "fill3" },
        "Metal": { id: "bin4", fill: "fill4" },
        "Glass": { id: "bin5", fill: "fill5" }
    };

    if (bins[wasteType]) {
        const binData = bins[wasteType];
        document.getElementById(binData.id).innerText = `AI Status: ${wasteType} Detected!`;
        document.getElementById(binData.fill).style.width = "100%";
        document.getElementById(binData.fill).style.backgroundColor = "#4caf50";
    }
}
