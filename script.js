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
