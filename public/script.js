// ===============================
// 🔷 DEBUG LOGGER
// ===============================
function debug(label, value) {
    console.log("------------");
    console.log(label);
    console.log(value);
    console.log("------------");
}
// ===============================
// 🔷 ADD / REMOVE RANGE
// ===============================

function addRange() {
    const container = document.getElementById("rangeContainer");

    const div = document.createElement("div");
    div.className = "range-row";

    div.innerHTML = `
    <input type="text" placeholder="Series (e.g RK)" class="series" />
    <input type="number" placeholder="Start Number" class="start" />
    <input type="number" placeholder="End Number" class="end" />
    <button class="remove-btn" onclick="removeRange(this)">-</button>
  `;

    container.appendChild(div);
}

function removeRange(btn) {
    btn.parentElement.remove();
}

// ===============================
// 🔷 CHECK RESULTS (DEBUG MODE)
// ===============================

function checkResults() {

    console.clear();
    const textArea = document.getElementById("resultText");
    const container = document.getElementById("resultContainer");
    const downloadBtn = document.getElementById("downloadImageBtn");
    if (!textArea || !container) return;

    const text = textArea.value.trim();
    container.innerHTML = "";

    if (!text) {
        alert("Paste result text first.");
        return;
    }

    const ranges = getRanges();
    const prizeSections = parseResult(text);

   if (prizeSections.length === 0) {
    alert("Parsing failed.");
    downloadBtn.disabled = true; // keep disabled
    return;
}

 
    container.classList.add("result-sheet");

    // 🔷 ADD HEADER DYNAMICALLY
    const header = document.createElement("div");
    header.className = "sheet-header";
    header.innerHTML = `
    <div class="sheet-header-row">
        <div class="title">Vasantham Lottery</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
    </div>
    `;
    container.appendChild(header);

    let matchCount = 0;

    prizeSections.forEach(section => {

        const sectionDiv = document.createElement("div");
        sectionDiv.className = "sheet-section";

        const title = document.createElement("div");
        title.className = "sheet-title";
        title.innerText = `${section.prizeName} : ₹${section.amount}/-`;

        const numbersDiv = document.createElement("div");
        numbersDiv.className = "sheet-numbers";

        section.tickets.forEach(ticket => {

            let isMatched = false;

            for (let range of ranges) {

                // 🥇 FULL TICKET (Ignore series)
                if (/^[A-Z]{2}\d{6}$/i.test(ticket)) {

                    const number = parseInt(ticket.substring(2));

                    if (number >= range.start && number <= range.end) {
                        isMatched = true;
                        matchCount++;
                        break; // ✅ Stop after first match
                    }
                }

                // 🥈 4 DIGIT PRIZE
                else if (/^\d{4}$/.test(ticket)) {

                    const number = parseInt(ticket);
                    const startLast4 = range.start % 10000;
                    const endLast4 = range.end % 10000;

                    if (number >= startLast4 && number <= endLast4) {
                        isMatched = true;
                        matchCount++;
                        break; // ✅ Stop after first match
                    }
                }
            }

            const num = document.createElement("div");
            num.className = "sheet-number";
            num.innerText = ticket;

            if (isMatched) {
                num.classList.add("highlight");
            }

            numbersDiv.appendChild(num);
        });

        sectionDiv.appendChild(title);
        sectionDiv.appendChild(numbersDiv);
        container.appendChild(sectionDiv);
    });

    if (ranges.length > 0) {
        alert("Total Matches Found: " + matchCount);
    }
    downloadBtn.disabled = false; // enable after success
}

// ===============================
// 🔷 PARSE RESULT TEXT
// ===============================

function parseResult(text) {

    // 🔥 Remove unwanted parts first
    text = text.replace(/```[\s\S]*?```/g, "");  // remove code block
    text = text.replace(/https?:\/\/\S+/g, "");  // remove links
    text = text.replace(/_To view[\s\S]*/i, ""); // remove footer part

    let parsed = [];

    const regex = /\*(.*?)Prize\s*:\*\s*Amount:\s*₹?([\d,]+)\/-(.*?)(?=\*\d+\s|\*Consolation|\*To view|$)/gs;

    let match;

    while ((match = regex.exec(text)) !== null) {

        const prizeName = match[1].trim() + "Prize";
        const amount = match[2];
        const numbersRaw = match[3];

        // 🔥 Keep only valid tickets (RK123456 or 4-digit)
        const tickets = numbersRaw
            .replace(/\n/g, " ")
            .split(/\s+/)
            .filter(t => /^[A-Z]{2}\d{6}$/.test(t) || /^\d{4}$/.test(t));

        parsed.push({
            prizeName,
            amount,
            tickets
        });
    }

    return parsed;
}

// ===============================
// 🔷 GET RANGES
// ===============================

function getRanges() {

    const rows = document.querySelectorAll(".range-row");
    let ranges = [];

    rows.forEach(row => {

        const start = parseInt(row.querySelector(".start").value);
        const end = parseInt(row.querySelector(".end").value);

        if (!isNaN(start) && !isNaN(end)) {
            ranges.push({ start, end });
        }

    });

    return ranges;
}

async function downloadImage() {

    const element = document.getElementById("resultContainer");

    if (!element.innerHTML.trim()) {
        alert("No result to download.");
        return;
    }

    // 🔹 Save original styles
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;

    // 🔹 Force A4 / Desktop width for image
    element.style.width = "900px";
    element.style.maxWidth = "900px";

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 900
    });

    // 🔹 Restore original mobile layout
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    const today = new Date();

    const formattedDate =today.getDate().toString().padStart(2, '0') + "-" +
    (today.getMonth() + 1).toString().padStart(2, '0') + "-" +
    today.getFullYear();

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download =`Vasantham-Result-${formattedDate}.png`;
    link.click();
}