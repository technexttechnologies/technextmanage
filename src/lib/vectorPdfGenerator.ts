import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { TECHNEXT_LOGO_BASE64 } from "./technextLogoBase64";
import { BillingDocumentData } from "@/components/billing/TechNextDocumentTemplate";

function formatCurrency(amt: number): string {
  return Number(amt || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d: any): string {
  if (!d) return "---";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/**
 * Generates an authentic 100% Vector PDF for TechNext Invoices, Quotations, Refunds, and Orders.
 * Matches the uploaded executive invoice standard with crisp vector typography, official logo, and clean A4 grid.
 */
export function generateDocumentVectorPdf(data: BillingDocumentData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // 1. Header with TechNext Logo & Company Info (Matching Uploaded Generation)
  // Top Left: Document Title & Company Address
  const titles: Record<string, string> = {
    INVOICE: "INVOICE",
    QUOTATION: "QUOTATION",
    ORDER_FORM: "ORDER FORM",
    PAYMENT_RECEIPT: "PAYMENT RECEIPT",
    REFUND: "CREDIT NOTE / REFUND"
  };

  const titleText = titles[data.documentType] || data.documentType || "INVOICE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(titleText, margin, 18);

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("TECHNEXT TECHNOLOGIES", margin, 24);

  // Addresses & Contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text("PULPALLY", margin, 28.5);
  doc.text("WAYANAD,673579", margin, 33);
  doc.text("Email:    info.technexttech@gmail.com", margin, 37.5);

  // Top Right: Official TechNext Logo
  try {
    const logoWidth = 46;
    const logoHeight = 12.5;
    const logoX = pageWidth - margin - logoWidth;
    const logoY = 15;
    doc.addImage(TECHNEXT_LOGO_BASE64, "PNG", logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn("Could not render logo in PDF:", err);
  }

  // Thin Horizontal Divider
  doc.setDrawColor(209, 213, 219); // #d1d5db
  doc.setLineWidth(0.35);
  doc.line(margin, 42, pageWidth - margin, 42);

  // 2. Bill To & Metadata Section (2 columns)
  const metaStartY = 48;

  // Left Column: Bill to / Customer Details
  const billToLabel = data.documentType === "QUOTATION" ? "Quotation For" : data.documentType === "ORDER_FORM" ? "Ordered By" : data.documentType === "PAYMENT_RECEIPT" ? "Received From" : "Bill to";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(billToLabel, margin, metaStartY);

  const clientName = (data.customer.company || data.customer.name || "Customer").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(clientName, margin, metaStartY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  let currentLeftY = metaStartY + 10;
  if (data.customer.address && data.customer.address.trim()) {
    const splitAddr = doc.splitTextToSize(data.customer.address, 75);
    doc.text(splitAddr, margin, currentLeftY);
    currentLeftY += splitAddr.length * 4;
  }
  if (data.customer.phone) {
    doc.text(`Phone:    ${data.customer.phone}`, margin, currentLeftY);
    currentLeftY += 4;
  }
  const custCode = data.customer.customerNumber ? `TN-${data.customer.customerNumber}` : data.customer.aroniumCode ? `TN-${data.customer.aroniumCode}` : (data.customer.id ? `TN-${data.customer.id.slice(-4)}` : "TN-7656");
  doc.text(`Code:    ${custCode}`, margin, currentLeftY);
  currentLeftY += 4;

  if (data.customer.gstNumber) {
    doc.text(`GSTIN:    ${data.customer.gstNumber}`, margin, currentLeftY);
    currentLeftY += 4;
  }

  // Right Column: Document Details & Bank Details
  const rightColX = 115;
  const rightValX = rightColX + 32;

  const numberLabel = data.documentType === "QUOTATION" ? "Quotation No.:" : data.documentType === "ORDER_FORM" ? "Order No.:" : data.documentType === "PAYMENT_RECEIPT" ? "Receipt No.:" : "Invoice No.:";
  const dueLabel = data.documentType === "QUOTATION" ? "Valid until:" : "Due date:";

  const bankLines = (data.bankDetails || "SOUTH INDIAN BANK\nPULPALLY").split("\n").map(l => l.trim()).filter(Boolean);

  const metaFields = [
    { label: numberLabel, val: data.documentNumber, isBold: true },
    { label: "Date:", val: formatDate(data.date), isBold: false },
    { label: dueLabel, val: formatDate(data.dueDate || data.date), isBold: false },
    { label: "Payment status:", val: data.paymentStatus || "Paid", isBold: true },
  ];

  let metaY = metaStartY;
  metaFields.forEach(item => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    doc.text(item.label, rightColX, metaY);

    doc.setFont("helvetica", item.isBold ? "bold" : "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(item.val, rightValX, metaY);
    metaY += 5;
  });

  // Bank details row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  doc.text("Bank details:", rightColX, metaY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  bankLines.forEach((bLine, bIdx) => {
    doc.text(bLine, rightValX, metaY + (bIdx * 4));
  });
  const currentRightY = metaY + (bankLines.length * 4);

  // 3. Line Items Table (Matching exact layout: # | Item | Quantity | Unit price | Discount | Total)
  const tableStartY = Math.max(currentLeftY, currentRightY) + 4;

  const headers = [["#", "Item", "Quantity", "Unit price", "Discount", "Total"]];
  const tableRows = (data.items || []).map((it, idx) => {
    const itemName = it.name ? it.name.toUpperCase() : "ITEM";
    const discountVal = it.discount !== undefined && it.discount !== null && it.discount !== "---"
      ? (String(it.discount).includes("%") ? String(it.discount) : `${Number(it.discount).toFixed(2)}%`)
      : "0.00%";

    return [
      String(idx + 1),
      itemName + (it.description && it.description !== it.name ? `\n${it.description}` : ""),
      String(it.quantity || 1),
      formatCurrency(it.unitPrice),
      discountVal,
      formatCurrency(it.total)
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: headers,
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: [243, 244, 246], // #f3f4f6 light grey
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [209, 213, 219],
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      lineColor: [229, 231, 235],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left", fontStyle: "bold" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 25;

  // 4. Post-Table Split Layout: Left Deliverables & Notes, Right Totals Box
  const summaryBoxWidth = 72;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  const totalAmount = Number(data.totalAmount || 0);
  const paidAmount = Number(data.paidAmount !== undefined ? data.paidAmount : (data.paymentStatus === "Paid" ? totalAmount : 0));
  const amountDue = Number(data.amountDue !== undefined ? data.amountDue : Math.max(0, totalAmount - paidAmount));
  const payMethod = (data.paymentMethod || "UPI PAYMENT").toUpperCase();

  // Right Side: Total Bordered Cell (Matching Uploaded Image)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(summaryBoxX, finalY + 2, summaryBoxWidth, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const totalHeading = data.documentType === "QUOTATION" ? "Total Estimate" : "Total";
  doc.text(totalHeading, summaryBoxX + 3, finalY + 6.8);
  doc.text(`₹${formatCurrency(totalAmount)}`, summaryBoxX + summaryBoxWidth - 3, finalY + 6.8, { align: "right" });

  // Right Side: Payment Breakdown
  let payBlockY = finalY + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Payment method:", summaryBoxX, payBlockY);

  payBlockY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  // If split tender details exist
  if (data.splitBreakdown && (Number(data.splitBreakdown.upi) > 0 || Number(data.splitBreakdown.cash) > 0)) {
    if (Number(data.splitBreakdown.upi) > 0) {
      doc.text("UPI PAYMENT:", summaryBoxX, payBlockY);
      doc.text(`₹${formatCurrency(Number(data.splitBreakdown.upi))}`, summaryBoxX + summaryBoxWidth, payBlockY, { align: "right" });
      payBlockY += 4;
    }
    if (Number(data.splitBreakdown.cash) > 0) {
      doc.text("CASH PAYMENT:", summaryBoxX, payBlockY);
      doc.text(`₹${formatCurrency(Number(data.splitBreakdown.cash))}`, summaryBoxX + summaryBoxWidth, payBlockY, { align: "right" });
      payBlockY += 4;
    }
  } else {
    const tenderLabel = payMethod.includes("UPI") ? "UPI PAYMENT:" : `${payMethod}:`;
    doc.text(tenderLabel, summaryBoxX, payBlockY);
    doc.text(`₹${formatCurrency(paidAmount > 0 ? paidAmount : 0)}`, summaryBoxX + summaryBoxWidth, payBlockY, { align: "right" });
    payBlockY += 4;
  }

  if (data.creditTerms) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text(`Credit: ${data.creditTerms}`, summaryBoxX, payBlockY);
    payBlockY += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
  }

  doc.text("Paid amount:", summaryBoxX, payBlockY);
  if (paidAmount > 0) {
    doc.setTextColor(22, 101, 52);
  }
  doc.text(`₹${formatCurrency(paidAmount)}`, summaryBoxX + summaryBoxWidth, payBlockY, { align: "right" });
  doc.setTextColor(0, 0, 0);
  payBlockY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Amount due:", summaryBoxX, payBlockY);
  doc.setTextColor(amountDue > 0 ? 220 : 22, amountDue > 0 ? 38 : 101, amountDue > 0 ? 38 : 52);
  doc.text(`₹${formatCurrency(amountDue)}`, summaryBoxX + summaryBoxWidth, payBlockY, { align: "right" });
  doc.setTextColor(0, 0, 0);
  payBlockY += 4;

  if (paidAmount > 0 && amountDue > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(29, 78, 216);
    doc.text(`Status: Partially Paid (₹${formatCurrency(paidAmount)} paid)`, summaryBoxX, payBlockY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    payBlockY += 4;
  }

  // Left Side: Scope / Deliverables / Narrative Notes (Matching exact uploaded generation)
  let leftScopeY = finalY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  // Parse lines from scopeOfWork or line items descriptions
  let scopeLines: string[] = [];
  if (data.scopeOfWork) {
    scopeLines = data.scopeOfWork.split(/\n|;/).map(s => s.trim()).filter(Boolean);
  }
  if (scopeLines.length === 0) {
    scopeLines = (data.items || []).filter(it => it.description && it.description !== it.name).map(it => it.description!);
  }

  const maxScopeWidth = summaryBoxX - margin - 8;
  scopeLines.slice(0, 6).forEach(line => {
    const wrapped = doc.splitTextToSize(line.toUpperCase(), maxScopeWidth);
    doc.text(wrapped, margin, leftScopeY);
    leftScopeY += wrapped.length * 3.8;
  });

  // If payment installments / schedule exist, print installment summary
  let scheduleEndBlockY = payBlockY;
  if (data.paymentSchedule && Array.isArray(data.paymentSchedule) && data.paymentSchedule.length > 0) {
    let schedY = Math.max(payBlockY, leftScopeY) + 4;
    if (schedY < pageHeight - 90) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text("PAYMENT INSTALLMENTS / SCHEDULE:", margin, schedY);
      schedY += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      data.paymentSchedule.forEach((inst: any, idx: number) => {
        if (schedY < pageHeight - 82) {
          const dtStr = inst.date ? formatDate(inst.date) : "---";
          const isInstPaid = inst.status === "PAID";
          doc.setTextColor(isInstPaid ? 22 : 180, isInstPaid ? 101 : 83, isInstPaid ? 52 : 9);
          doc.text(`• ${idx + 1}. ${dtStr} - ${inst.method || 'UPI'}: ₹${formatCurrency(Number(inst.amount) || 0)} [${inst.status || 'PAID'}] ${inst.reference ? `(${inst.reference})` : ''}`, margin, schedY);
          doc.setTextColor(0, 0, 0);
          schedY += 3.5;
        }
      });
      scheduleEndBlockY = schedY;
    }
  }

  // 5. Official Enterprise Footer & Policy Terms (Matching Uploaded Image)
  let footerStartY = Math.max(payBlockY, leftScopeY, scheduleEndBlockY) + 8;
  // Ensure the footer fits on the page without awkward overflow
  if (footerStartY < pageHeight - 78) {
    footerStartY = pageHeight - 78;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text("Thank You for Choosing", margin, footerStartY);

  footerStartY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text("TECHNEXT TECHNOLOGIES", margin, footerStartY);

  footerStartY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text("Delivering Innovative Digital Solutions with Quality, Creativity & Trust.", margin, footerStartY);

  footerStartY += 3;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(margin, footerStartY, margin + 45, footerStartY);

  footerStartY += 4.5;

  // Payment Terms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment Terms", margin, footerStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(31, 41, 55);
  const paymentTermsList = [
    "• Kindly make the payment within the due date mentioned on the performa",
    "• 50% advance payment is applicable for customized projects/services",
    "• Late payments may attract additional service charges",
    "• Payments once processed are non-refundable after project initiation",
  ];

  paymentTermsList.forEach(pt => {
    footerStartY += 3.4;
    doc.text(pt, margin, footerStartY);
  });

  footerStartY += 4.5;

  // Support & Service
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Support & Service", margin, footerStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(31, 41, 55);
  const supportList = [
    "• Technical support will be provided as per the selected service package",
    "• Any additional revisions or services beyond the agreed scope may be chargeable",
    "• Warranty/service coverage applies only to specified products & durations",
  ];

  supportList.forEach(st => {
    footerStartY += 3.4;
    doc.text(st, margin, footerStartY);
  });

  // Bottom Line & TechNext Attribution
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text("TechNext Technologies • www.technexttechnologies.in", margin, pageHeight - 6.5);
  doc.text("Page 1", pageWidth - margin, pageHeight - 6.5, { align: "right" });

  // Save the crisp vector PDF directly
  const safeDocNum = (data.documentNumber || "DOC").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `TechNext_${data.documentType || "DOCUMENT"}_${safeDocNum}.pdf`;
  doc.save(fileName);
}

/**
 * Generates an authentic Vector PDF for all 21 Aronium Sales Reports.
 */
export function generateReportVectorPdf(
  reportData: {
    title: string;
    headers: string[];
    rows: any[][];
    totalSum: number;
    totalPaid: number;
    totalDue: number;
  },
  periodLabel: string = "All Time"
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // Header Logo
  try {
    doc.addImage(TECHNEXT_LOGO_BASE64, "PNG", pageWidth - margin - 48, 12, 48, 14);
  } catch (err) {
    console.warn("Logo error:", err);
  }

  // Report Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(reportData.title, margin, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("TECHNEXT ENTERPRISE ERP - FINANCIAL AUDIT DIVISION", margin, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Audit Period: ${periodLabel}  |  Scope: Invoices Only (Estimates Excluded)`, margin, 29);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, 33);

  // Line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, 36, pageWidth - margin, 36);

  // Table
  autoTable(doc, {
    startY: 40,
    margin: { left: margin, right: margin },
    head: [reportData.headers],
    body: reportData.rows,
    theme: "plain",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    foot: [
      [
        "GRAND TOTAL",
        ...Array(Math.max(0, reportData.headers.length - 4)).fill(""),
        `₹${formatCurrency(reportData.totalSum)}`,
        `₹${formatCurrency(reportData.totalPaid)}`,
        `₹${formatCurrency(reportData.totalDue)}`
      ]
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8,
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  // Verification block
  const verifyY = Math.min(Math.max(finalY + 12, pageHeight - 38), pageHeight - 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Official system-generated statement from TechNext Enterprise ERP. Certified by Accounts & Auditing Division.", margin, verifyY);

  doc.line(pageWidth - margin - 50, verifyY + 8, pageWidth - margin, verifyY + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", pageWidth - margin - 50, verifyY + 12);
  doc.setFont("helvetica", "normal");
  doc.text("TechNext Technologies", pageWidth - margin - 50, verifyY + 16);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("TechNext Technologies ERP • www.technexttechnologies.in", margin, pageHeight - 8);

  const safeTitle = reportData.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  doc.save(`TechNext_Report_${safeTitle}_${new Date().toISOString().split("T")[0]}.pdf`);
}
