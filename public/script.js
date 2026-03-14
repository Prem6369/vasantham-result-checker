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

    document.getElementById("resultContainer").style.display = "block";
    const textArea = document.getElementById("resultText");
    const container = document.querySelector("#resultContent .result-sheet");
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
 
   //container.classList.add("result-sheet");

    // 🔷 ADD HEADER DYNAMICALLY
 
    let matchCount = 0;

    prizeSections.forEach(section => {

        const sectionDiv = document.createElement("div");
        sectionDiv.className = "sheet-section";

        const title = document.createElement("div");
        title.className = "sheet-title";
        title.innerText = `${section.prizeName.replace(/\*/g,"")} : ₹${section.amount}/-`;

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
            num.innerText = ticket.replace(/\*/g, "");

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

    // clean unwanted text
    text = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/Shared From The App/gi, "")
        .replace(/Download.*Application/gi, "")
        .replace(/\*/g, "")
        .trim();

    const lines = text.split("\n");

    let parsed = [];
    let current = null;

    lines.forEach(line => {

        line = line.trim();

        // detect prize line
        const prizeMatch = line.match(/(.*Prize)\s*:\s*Amount:\s*₹?([\d,]+)/i);

        if (prizeMatch) {

            if (current) parsed.push(current);

            current = {
                prizeName: prizeMatch[1].trim(),
                amount: prizeMatch[2],
                tickets: []
            };

            // extract numbers from same line
            const nums = line.match(/[A-Z]{2}\d{6}|\d{4}/g);
            if (nums) current.tickets.push(...nums);

        } else if (current) {

            const nums = line.match(/[A-Z]{2}\d{6}|\d{4}/g);
            if (nums) current.tickets.push(...nums);

        }

    });

    if (current) parsed.push(current);

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
    window.scrollTo(0,0);

    /* Save original styles */
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;

    /* Force desktop layout for capture */
    element.style.width = "900px";
    element.style.maxWidth = "900px";

    const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 900,
    scrollX: 0,
    scrollY: -window.scrollY
});

    /* Restore styles */
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;

    const today = new Date();

    const formattedDate =
        today.getDate().toString().padStart(2, '0') + "-" +
        (today.getMonth() + 1).toString().padStart(2, '0') + "-" +
        today.getFullYear();

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `claysys    -${formattedDate}.png`;
    link.click();
}