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

