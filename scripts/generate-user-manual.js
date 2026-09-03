const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  ImageRun,
} = require("docx");

function buildUserManualDoc() {
  const primaryColor = "1E3A8A"; // Navy Blue
  const secondaryColor = "0D9488"; // Teal
  const accentColor = "B45309"; // Amber/Bronze
  const darkTextColor = "1F2937";
  const lightBgColor = "F8FAFC";
  const alertBgColor = "FEF3C7";
  const alertTextColor = "92400E";
  const headerBgColor = "0F172A";
  const tableBorderColor = "CBD5E1";

  // Screenshot paths
  const img1Path = "C:/Users/AMIT/.gemini/antigravity/brain/af409bd4-6b62-4fd5-9260-195c05a95fef/.user_uploaded/media_1788333919728.png";
  const img2Path = "C:/Users/AMIT/.gemini/antigravity/brain/af409bd4-6b62-4fd5-9260-195c05a95fef/.user_uploaded/media_1788333971015.jpg";
  const img3Path = "C:/Users/AMIT/.gemini/antigravity/brain/af409bd4-6b62-4fd5-9260-195c05a95fef/.user_uploaded/media_1788333919795.png";

  const img1Data = fs.existsSync(img1Path) ? fs.readFileSync(img1Path) : null;
  const img2Data = fs.existsSync(img2Path) ? fs.readFileSync(img2Path) : null;
  const img3Data = fs.existsSync(img3Path) ? fs.readFileSync(img3Path) : null;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: darkTextColor,
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              after: 120,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "EASY REPORT ERP — USER MANUAL & VISUAL GUIDE | ATSFY TECHNOLOGIES",
                    size: 16,
                    color: "64748B",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.SPACE_BETWEEN,
                children: [
                  new TextRun({
                    text: "Made Under ATSFY Technologies • Confidential User Guide",
                    size: 16,
                    color: "64748B",
                  }),
                  new TextRun({
                    text: "\tPage ",
                    size: 16,
                    color: "64748B",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: "64748B",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 16,
                    color: "64748B",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ==================== COVER PAGE ====================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 80 },
            children: [
              new TextRun({
                text: "EASY REPORT ERP",
                size: 52,
                bold: true,
                color: primaryColor,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: "Enterprise Wholesale & Retail Inventory, Billing & Khata Management Web Application",
                size: 24,
                color: "475569",
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "★ COMPLETE ILLUSTRATED USER MANUAL & HOW-TO-USE TRAINING GUIDE ★",
                size: 20,
                bold: true,
                color: secondaryColor,
              }),
            ],
          }),

          // METADATA BOX
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "🏢 Organization / Parent Company: ", bold: true }),
                          new TextRun({ text: "Made Under ATSFY Technologies", bold: true, color: primaryColor }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "📦 Software Edition: ", bold: true }),
                          new TextRun({ text: "Easy Report ERP v2.0 (Fiscal Year 2026-27 Edition)" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "🌐 Architecture & Sync: ", bold: true }),
                          new TextRun({ text: "Google Cloud Firebase Firestore (Real-Time Cloud) + Offline LocalStorage Fallback" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "🎯 Target Users: ", bold: true }),
                          new TextRun({ text: "Store Owners, Cashiers, Warehouse Managers, Accountants & Inventory Auditors" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // ==================== 1. INTRODUCTION ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "1. Introduction & System Overview", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Easy Report ERP is an enterprise-grade web application built under ",
              }),
              new TextRun({ text: "ATSFY Technologies", bold: true }),
              new TextRun({
                text: " to eliminate manual paperwork, prevent stock overselling, safeguard profit margins against excessive discounting, and provide instant real-time Khata (ledger) reconciliation for wholesale distributors and retail merchants.",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Universal System Principles:", bold: true }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ bold: true, text: "Strict Stock Validation: " }),
              new TextRun({ text: "You can only sell products that have been inwarded into the warehouse. Items with 0 stock cannot be added to bills, and entered quantities cannot exceed available inventory." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ bold: true, text: "Dynamic Stock Equation: " }),
              new TextRun({ text: "Live Warehouse Stock is mathematically calculated in real-time as: " }),
              new TextRun({ text: "Live Stock = Total Purchased Qty − Total Sold Qty.", bold: true, color: primaryColor }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ bold: true, text: "Loss Protection Warning: " }),
              new TextRun({ text: "If a cashier applies a discount that makes the effective selling price lower than the landing purchase rate, the system shows an immediate amber warning explaining the exact unit loss, while allowing authorized staff to proceed." }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 } }),

          // ==================== 2. STOCK INWARD MODULE ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "2. Stock Inward (Purchase Module) — Step-by-Step Guide", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The Stock Inward module is located at the '/purchase' URL and accessed via the sidebar menu under 'Stock Inward (Purchase)'. This is where all incoming stock shipments from distributors, suppliers, and manufacturers are logged.",
              }),
            ],
          }),

          // SCREENSHOT 1 INSERTION
          ...(img1Data
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120, after: 80 },
                  children: [
                    new ImageRun({
                      data: img1Data,
                      transformation: {
                        width: 540,
                        height: 310,
                      },
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: "Figure 1: Stock Inward Record & Supplier Item Inward Table (Mohan Kirana Store Bill Example)",
                      italics: true,
                      size: 18,
                      color: "64748B",
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "How to Use Which One — Inward Controls & Inputs:", bold: true, size: 22, color: secondaryColor })],
          }),

          // INWARD CONTROLS TABLE TUTORIAL
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Control / Input Name", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Location & Type", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "What It Does & How To Use It", bold: true, color: "FFFFFF" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Supplier Name / Vendor", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Top Header (Left Input)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Type to search existing suppliers. If vendor is new, click '+ Add Supplier' directly above it. Cannot log purchase without entering supplier name." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "+ Add Supplier Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Above Supplier input" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Opens a 5-field pop-up modal: (1) Supplier Name, (2) Address, (3) Phone Number, (4) Shop License, (5) GST No. Click 'Save Supplier' to auto-select and register vendor." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Supplier Invoice #", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Top Header (Middle Input)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Enter the physical bill/invoice number from the supplier (e.g. PUR-2026-8834 or INV-9912) for tracking and Khata reference." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Inward Date", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Top Header (Right Input)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Date picker for the receipt date of the goods. Defaults to today's date." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Item Name / Description", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Entry Row (Left Column)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Type product name. Dropdown displays all catalog products with company, packing, MRP, and purchase rate. Typing an existing item auto-fills Rate & MRP." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "+ Add Item Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Above Item Name input" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Opens 5-field pop-up modal: (1) Item Name, (2) Packing (e.g. 10x10, 1kg), (3) Company (e.g. Sun Pharma, Tata), (4) Purchase Rate ₹, (5) MRP ₹. Adds to catalog and auto-fills row." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Batch Code & Expiry", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Entry Row (Columns 2 & 3)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Enter batch number (e.g. BCH-6913) and expiry month (e.g. 2028-12). Typing an existing batch automatically pulls its product details!" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Rate (₹) & MRP (₹)", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Entry Row (Columns 4 & 5)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Rate is what you paid the supplier per unit. MRP is the package printed selling price. Both are stored for profit and billing calculations." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Qty Input & [+] Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Entry Row (Right Side)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Enter shipment quantity and click '+' to stage the item into the Staged Inventory list below." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Log Purchase & Synchronize Stock", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Bottom Action Bar" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Finalizes inward: increases live warehouse stock, adds credit transaction to Supplier Khata ledger, and opens Printable Inward Voucher." })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // ==================== 3. ACTIVE BILLING (SALE) MODULE ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "3. Active Billing (Sale Module & POS) — Step-by-Step Guide", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The Active Billing module (/sale) is the high-speed point-of-sale checkout system. It is designed for daily retail counters and wholesale invoicing with real-time stock and margin protections.",
              }),
            ],
          }),

          // SCREENSHOT 2 & 3 INSERTION
          ...(img2Data
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120, after: 80 },
                  children: [
                    new ImageRun({
                      data: img2Data,
                      transformation: {
                        width: 540,
                        height: 240,
                      },
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 140 },
                  children: [
                    new TextRun({
                      text: "Figure 2: Active Billing POS Interface showing Live Stock Indicators & Strict Stock Validation",
                      italics: true,
                      size: 18,
                      color: "64748B",
                    }),
                  ],
                }),
              ]
            : []),

          ...(img3Data
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120, after: 80 },
                  children: [
                    new ImageRun({
                      data: img3Data,
                      transformation: {
                        width: 540,
                        height: 310,
                      },
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: "Figure 3: Invoice Modification & Line Items Breakdown Screen (Ravi Kishan Sale Bill Example)",
                      italics: true,
                      size: 18,
                      color: "64748B",
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "How to Use Which One — Billing Controls & POS Actions:", bold: true, size: 22, color: secondaryColor })],
          }),

          // BILLING CONTROLS TABLE TUTORIAL
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "POS Control / Button", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Screen Position", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "How to Use & Business Rule", bold: true, color: "FFFFFF" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Customer Name Input", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Top Header (Left)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Type any customer name (e.g. 'Ravi Kishan', 'Acme Enterprises'). Defaults to 'Cash Customer'. Invoices are saved under the exact typed name." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Payment Mode Dropdown", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Top Header (Middle)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Select 'Cash (Paid)' for immediate settlement. Select 'Credit (Khata)' to post the bill to the customer's ledger as an outstanding balance." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Purchased Item Search", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Item Entry Row (Left)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Search product name or scan barcode. Auto-retrieves MRP directly from inward purchases. Unpurchased items cannot be billed." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Live Stock Indicator Badge", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Above Qty / Entry Row" })] }),
                  new TableCell({ children: [new Paragraph({ text: "🟢 'Warehouse Stock: X Pcs' indicates available units. 🔴 'Out of Stock (0 units)' indicates item cannot be added." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Qty Input (Strict Stock)", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Item Entry Row (Qty)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Enter sale quantity. If entered quantity exceeds available stock (e.g. stock is 7 and you type 8), ADD is blocked with Insufficient Stock warning." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Disc (%) & Loss Warning", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Item Entry Row (Disc)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Enter discount %. If effective rate drops below purchase rate, an amber 'Selling at a Loss' banner appears. You can still click ADD to proceed." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "ADD Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Item Entry Row (Right)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Adds line item to the bill table below. Disabled when stock is 0." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "HOLD / Restore Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Bottom Action Bar" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Puts active bill on hold if customer steps away. Click 'Restore' in the top header to recall held items instantly." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "CLEAR Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Bottom Action Bar" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Clears all line items from the active bill to start fresh." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "SAVE & PRINT Button", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Bottom Action Bar (Primary)" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Validates all line items against live warehouse stock, deducts inventory, records the sale, and opens the Printable Receipt Modal (ESC to close, Ctrl+P to print)." })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // ==================== 4. LIVE INVENTORY RECONCILIATION ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "4. Live Inventory & Universal Stock Formula", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The Stock Status grid (/inventory) ensures zero discrepancy between physical shelves and computer records using automatic reconciliation:",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: "Live Available Stock = Total Purchased Qty − Total Sold Qty",
                bold: true,
                size: 24,
                color: primaryColor,
              }),
            ],
          }),

          // INVENTORY STATUS TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Stock Badge", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Stock Range", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: headerBgColor, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Operator Action Required", bold: true, color: "FFFFFF" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "🟢 OPTIMAL", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "10 or more units" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Healthy inventory. Normal sales billing permitted." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "🟠 LOW STOCK", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "1 to 9 units" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Reorder recommended. Use Product Performance to generate supplier Purchase Order (PO)." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "🔴 CRITICAL", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "0 units in warehouse" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Out of stock. Sale billing blocked until new purchase shipment is inwarded." })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "🟣 EXPIRED", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Expiry date < System date" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Unsafe for sale. Go to Expiry Board to generate Supplier Return Voucher." })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // ==================== 5. OTHER MODULES & TUTORIALS ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "5. Additional Management Modules", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• " }),
              new TextRun({ bold: true, text: "Party Accounts / Khata (/ledger): " }),
              new TextRun({ text: "Select customer or vendor. View complete debit/credit transaction statement, balance breakdown, and click 'Record Payment' to log cash/bank settlements.\n" }),
              new TextRun({ text: "• " }),
              new TextRun({ bold: true, text: "Today's Profit Analysis (/profit): " }),
              new TextRun({ text: "View today's revenue, cost of goods sold (COGS), gross profit ₹, and net margin % dynamically reconciled from sales and purchases.\n" }),
              new TextRun({ text: "• " }),
              new TextRun({ bold: true, text: "Product Performance Matrix (/performance): " }),
              new TextRun({ text: "Analyzes sales velocity (Fast Moving, Steady, Slow Moving, Dead Stock Risk) and features a 1-click Smart Purchase Order (PO) creator.\n" }),
              new TextRun({ text: "• " }),
              new TextRun({ bold: true, text: "Expiry Alert Board (/expiry): " }),
              new TextRun({ text: "Monitors near-expiry batches (60 Days / 90 Days) and generates Supplier Purchase Return Credit Vouchers." }),
            ],
          }),

          new Paragraph({ spacing: { after: 240 } }),

          // ==================== 6. ATSFY TECHNOLOGIES SUPPORT ====================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: "6. ATSFY Technologies Support & Maintenance", bold: true, size: 28, color: primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Easy Report ERP is an intellectual property engineered and maintained under ",
              }),
              new TextRun({ text: "ATSFY Technologies", bold: true }),
              new TextRun({
                text: ". For technical support, custom hardware integrations (thermal printers, barcode scanners, weighing scales), or database backup services, contact ATSFY Technologies customer engineering.",
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: lightBgColor, type: ShadingType.CLEAR },
                    margins: { top: 120, bottom: 120, left: 160, right: 160 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Company: ", bold: true }),
                          new TextRun({ text: "ATSFY Technologies" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Product: ", bold: true }),
                          new TextRun({ text: "Easy Report ERP v2.0 (Fiscal Year 2026-27 Edition)" }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Documentation: ", bold: true }),
                          new TextRun({ text: "Illustrated User Manual & SOP (Version 2.2)" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 360 },
            children: [
              new TextRun({
                text: "— End of Manual • Engineered Under ATSFY Technologies —",
                size: 18,
                color: "94A3B8",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

async function main() {
  const doc = buildUserManualDoc();
  const buffer = await Packer.toBuffer(doc);

  const mainPath = path.join(process.cwd(), "Easy_Report_ERP_User_Manual.docx");
  const fallbackPath = path.join(
    process.cwd(),
    "Easy_Report_ERP_User_Manual_ATSFY.docx",
  );

  let writtenMain = false;
  try {
    fs.writeFileSync(mainPath, buffer);
    console.log("Successfully updated main User Manual at:", mainPath);
    writtenMain = true;
  } catch (err) {
    console.warn(
      "Main docx file is currently locked in Word. Saving copy to:",
      fallbackPath,
    );
  }

  fs.writeFileSync(fallbackPath, buffer);
  console.log("Saved ATSFY User Manual at:", fallbackPath);
}

main().catch((err) => {
  console.error("Error generating docx:", err);
  process.exit(1);
});
