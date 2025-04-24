const Bill = require("../models/Bill");
const { ErrorResponse } = require("../utils/errorHandler");
const asyncHandler = require("../middleware/async");
// const asyncHandler = require("../config/my-medical-store-457806-b704679ceccf.json");

const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const { google } = require("googleapis");
const stream = require("stream");

exports.getBills = asyncHandler(async (req, res, next) => {
  const bills = await Bill.find();
  res.status(200).json(res.advancedResults);
});

exports.getBill = asyncHandler(async (req, res, next) => {
  const bill = await Bill.findById(req.params.id).populate(
    "addedBy",
    "name email"
  );

  if (!bill) {
    return next(
      new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: bill });
});

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(
    __dirname,
    "../config/my-medical-store-457806-b704679ceccf.json"
  ),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// https://drive.google.com/drive/folders/1P3I-gtP5TjSI37KDgwxncg3GfKLc6JuJ?usp=drive_link

const DRIVE_FOLDER_ID = "1P3I-gtP5TjSI37KDgwxncg3GfKLc6JuJ";

exports.createBill = asyncHandler(async (req, res, next) => {
  req.body.addedBy = req.user.id;
  const bill = await Bill.create(req.body);

  // Calculate total (assuming you missed this part)
  const total = bill.products.reduce((sum, item) => {
    return sum + item.quantity * item.discountPrice;
  }, 0);

  const upiUrl = `upi://pay?pa=mukesh-2893@ibl&pn=${encodeURIComponent(
    bill.billNo
  )}&am=${total}&cu=INR`;

  const qrCodeImage = await QRCode.toDataURL(upiUrl);

  // HTML Template
  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 40px; }
        h1, h3 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; }
        .qr { text-align: center; margin-top: 40px; }
      </style>
    </head>
    <body>
      <h1>Invoice</h1>
      <p>Bill No: ${bill.billNo}</p>
      <p>Date: ${bill.createdAt.toLocaleDateString()}</p>

      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${bill.products
            .map(
              (item) => `
            <tr>
              <td>${item.medicine}</td>
              <td>${item.quantity}</td>
              <td>${item.discountPrice}</td>
              <td>${item.quantity * item.discountPrice}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h3>Grand Total: ₹${total}</h3>

      <div class="qr">
        <h4>Scan to Pay via UPI</h4>
        <img src="${qrCodeImage}" width="200" height="200" />
      </div>
    </body>
    </html>
  `;

  // Generate PDF in memory
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(
      `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`,
      {
        waitUntil: "networkidle0",
      }
    );

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Upload PDF to Google Drive
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);

    const today = Date.now;
    const response = await drive.files.create({
      requestBody: {
        name: `${today}/${bill.billNo}.pdf`,
        mimeType: "application/pdf",
        parents: [DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: "application/pdf",
        body: bufferStream,
      },
      fields: "id, name",
    });
    console.log(response.data);

    const fileId = response.data.id;

    // Save Drive file ID in DB if needed
    await Bill.findByIdAndUpdate(
      bill._id,
      { pdfDriveFileId: fileId },
      { new: true }
    );

    // Stream file to user (optional, or you can send the fileId)
    const download = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bill.billNo}.pdf"`,
    });

    download.data
      .on("end", () => console.log("✅ PDF streamed to client"))
      .on("error", (err) => {
        console.error("Download error", err);
        res.status(500).send("Failed to stream PDF");
      })
      .pipe(res);
  } catch (err) {
    await browser.close();
    return next(
      new ErrorResponse("PDF generation failed: " + err.message, 500)
    );
  }
});

// download uplpoad file with id

exports.downloadFile = asyncHandler(async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    const { fileId } = req.params;

    // Optional: get file metadata to set filename
    const metadata = await drive.files.get({
      fileId,
      fields: "name",
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${metadata.data.name}"`,
    });

    const result = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    result.data
      .on("end", () => console.log("✅ File download completed"))
      .on("error", (err) => {
        console.error("Download error", err);
        res.status(500).send("Error streaming file from Drive");
      })
      .pipe(res);
  } catch (err) {
    console.error("Drive error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// this is create bill with response PDF but we dont want to store pdf

// exports.createBill = asyncHandler(async (req, res, next) => {
//   req.body.addedBy = req.user.id;
//   const bill = await Bill.create(req.body);

//   // Calculate total
//   const total = bill.products.reduce(
//     (sum, i) => sum + i.quantity * i.discountPrice,
//     0
//   );

//   // Generate UPI link
//   const upiUrl = `upi://pay?pa=mukesh-2893@ibl&pn=${encodeURIComponent(
//     bill.billNo
//   )}&am=${total}&cu=INR`;
//   // const upiUrl = `upi://pay?pa=${bill.upi.id}&pn=${encodeURIComponent(
//   //   bill.billNo
//   // )}&am=${total}&cu=INR`;

//   // Generate QR code
//   const qrCodeImage = await QRCode.toDataURL(upiUrl);

//   // Build HTML
//   const html = `
//     <html>
//     <head>
//       <style>
//         body { font-family: Arial; padding: 40px; }
//         h1, h3 { text-align: center; }
//         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//         th, td { border: 1px solid #000; padding: 8px; }
//         .qr { text-align: center; margin-top: 40px; }
//       </style>
//     </head>
//     <body>
//       <h1>Invoice</h1>
//       <p>Bill No: ${bill.billNo}</p>
//       <p>Date: ${bill.createdAt}</p>

//       <table>
//         <thead>
//           <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
//         </thead>
//         <tbody>
//           ${bill.products
//             .map(
//               (item) => `
//             <tr>
//               <td>${item.medicine}</td>
//               <td>${item.quantity}</td>
//               <td>${item.discountPrice}</td>
//               <td>${item.quantity * item.discountPrice}</td>
//             </tr>
//           `
//             )
//             .join("")}
//         </tbody>
//       </table>

//       <h3>Grand Total: ₹${total}</h3>

//       <div class="qr">
//         <h4>Scan to Pay via UPI</h4>
//         <img src="${qrCodeImage}" width="200" height="200" />
//         <p>{bill.upi.id}</p>
//       </div>
//     </body>
//     </html>
//   `;

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"], // Good for production/staging
//   });
//   try {
//     const page = await browser.newPage();

//     // A workaround for "Requesting main frame too early!" — wait after newPage
//     await new Promise((resolve) => setTimeout(resolve, 100));

//     await page.goto(
//       `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`,
//       {
//         waitUntil: "networkidle0",
//       }
//     );

//     const pdfPath = path.join(__dirname, `../invoices/${bill._id}.pdf`);
//     await page.pdf({ path: pdfPath, format: "A4", printBackground: true });

//     await browser.close();

//     // Save path in DB
//     await Bill.findByIdAndUpdate(bill._id, { pdfPath });

//     res.status(201).json({
//       success: true,
//       data: bill,
//       message: "Bill created and PDF generated.",
//       pdf: `../invoices/${bill._id}.pdf`,
//     });
//   } catch (err) {
//     await browser.close();
//     return next(
//       new ErrorResponse("PDF generation failed: " + err.message, 500)
//     );
//   }

//   res.status(201).json({
//     success: true,
//     data: bill,
//     message: "Bill created and PDF generated.",
//     pdf: `../invoices/${bill._id}.pdf`,
//   });
// });

//
