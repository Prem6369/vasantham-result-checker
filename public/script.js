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

    if (!textArea) {
        console.error("❌ resultText not found");
        return;
    }

    if (!container) {
        console.error("❌ resultContainer not found");
        return;
    }

    const text = textArea.value.trim();


    container.innerHTML = "";

    if (!text) {
        alert("Paste result text first.");
        return;
    }

    const ranges = getRanges();
    debug("🎯 USER RANGES", ranges);

    const prizeSections = parseResult(text);
    debug("📦 PARSED PRIZE SECTIONS", prizeSections);

    if (prizeSections.length > 0) {
        document.querySelector(".download-btn.full").disabled = false;
    }
    if (prizeSections.length === 0) {
        console.error("❌ No prize sections detected.");
        alert("Parsing failed. Check result format.");
        return;
    }

    let matchCount = 0;

    prizeSections.forEach(section => {

        console.log("🔷 Processing Section:", section.prizeName);

        const block = document.createElement("div");
        block.className = "prize-block";

        const header = document.createElement("h3");
        header.innerText = `${section.prizeName} - ₹${section.amount}`;

        const numberList = document.createElement("div");
        numberList.className = "number-list";

        section.tickets.forEach(ticket => {

            console.log("Checking Ticket:", ticket);

            let isMatched = false;

            ranges.forEach(range => {

                // ===============================
                // 🥇 FULL TICKET (RK245689)
                // ===============================
                if (/^[A-Z]{2}\d{6}$/i.test(ticket)) {

                    const series = ticket.substring(0, 2).toUpperCase();
                    const number = parseInt(ticket.substring(2));

                    if (
                        range.series === series &&
                        number >= range.start &&
                        number <= range.end
                    ) {
                        console.log("✅ FULL MATCH:", ticket);
                        isMatched = true;
                        matchCount++;
                    }
                }

                // ===============================
                // 🥈 4 DIGIT PRIZE (1802, 9215)
                // ===============================
                else if (/^\d{4}$/.test(ticket)) {

                    const number = parseInt(ticket);

                    // Extract last 4 digits from user range
                    const startLast4 = parseInt(range.start.toString().slice(-4));
                    const endLast4 = parseInt(range.end.toString().slice(-4));

                    if (
                        number >= startLast4 &&
                        number <= endLast4
                    ) {
                        console.log("✅ 4 DIGIT MATCH:", ticket);
                        isMatched = true;
                        matchCount++;
                    }
                }

            });

            const span = document.createElement("span");
            span.innerText = ticket;

            if (isMatched) {
                span.classList.add("highlight");
            }

            numberList.appendChild(span);
        });

        block.appendChild(header);
        block.appendChild(numberList);
        container.appendChild(block);

    });

    console.log("🎉 TOTAL MATCH COUNT:", matchCount);

    if (ranges.length > 0) {
        alert("Total Matches Found: " + matchCount);
    }
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

        const series = row.querySelector(".series").value.trim().toUpperCase();
        const start = parseInt(row.querySelector(".start").value);
        const end = parseInt(row.querySelector(".end").value);

        if (!isNaN(start) && !isNaN(end)) {
            ranges.push({ series, start, end });
        }

    });

    return ranges;
}

async function downloadFull() {

    const resultContainer = document.getElementById("resultContainer");

    if (!resultContainer.innerHTML.trim()) {
        alert("No result to download.");
        return;
    }

    const htmlTemplate = `
  <html>
    <head>
        <style>
    @page {
        size: A4;
        margin: 0;
    }

    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        margin: 0;
        padding: 0;
        background: #f4f7fb;
        color: #333;
    }
      /* 🔷 FULL WIDTH HEADER */
        .header-img {
            width: 100%;
            height: auto;
            display: block;
        }
    /* 🔥 Gradient Header */
    .header {
        background: linear-gradient(135deg, #1e3c72, #2a5298);
        color: white;
        padding: 25px 20px;
        text-align: center;
    }

    .header h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 1px;
    }

    .header p {
        margin: 5px 0 0 0;
        font-size: 12px;
        opacity: 0.9;
    }

    /* Content */
    .content {
        padding: 20mm;
    }

    /* Divider */
    .divider {
        height: 3px;
        background: linear-gradient(90deg, #1e3c72, #2a5298);
        margin: 20px 0;
        border-radius: 4px;
    }

    /* 🔥 Prize Card */
    .prize-block {
        background: #ffffff;
        margin-bottom: 18px;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        border-left: 5px solid #2a5298;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .prize-block h3 {
        margin: 0 0 10px 0;
        font-size: 15px;
        color: #1e3c72;
    }

    /* Numbers */
    .number-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .number-list span {
        padding: 6px 10px;
        background: #eef3ff;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        border: 1px solid #d0dcff;
        min-width: 50px;
        text-align: center;
        transition: all 0.2s ease;
    }

    /* 🔥 Highlight Winning */
    .highlight {
        background: linear-gradient(135deg, #ffcc00, #ff9800) !important;
        color: #000 !important;
        font-weight: bold;
        border: none !important;
        box-shadow: 0 2px 6px rgba(255, 152, 0, 0.4);
    }

    /* Footer */
    .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 10px;
        color: #888;
    }
        </style>
    </head>
        <body>
      
            <div class="content">
            <img src="${window.location.origin}/images/vasanthamcontactbanner.png" class="header-img" />
              <div class="header">
                <h1>VASANTHAM DRAW RESULT</h1>
                <p>Smart Ticket Range Matching Report</p>
            </div>

                <div class="divider"></div>

                ${resultContainer.innerHTML}

                <div class="footer">
                    Generated by Vasantham Result System
                </div>
            </div>
        </body>
     </html>
  `;

    const response = await fetch("/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: htmlTemplate })
    });

    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Full-Result.pdf";
    link.click();
}