const express = require("express");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/generate-pdf", async (req, res) => {
    try {

        const { htmlContent } = req.body;

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote"
            ]
        });

        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: "domcontentloaded"
        });

        // 🔥 Extra safe wait
        await page.waitForTimeout(500); // 0.5 second delay

        // 🔥 Wait for images fully
        await page.evaluate(async () => {
            const imgs = Array.from(document.images);
            await Promise.all(
                imgs.map(img => {
                    if (img.complete) return;
                    return new Promise(resolve => {
                        img.onload = img.onerror = resolve;
                    });
                })
            );
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=full-result.pdf"
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Error:", error);
        res.status(500).send("PDF generation failed");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});