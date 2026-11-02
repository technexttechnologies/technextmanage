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
 * No HTML canvas screenshots. Sharp vector typography, official logo, and precise A4 layout.
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

  // 1. Header with TechNext Logo
  try {
    doc.addImage(TECHNEXT_LOGO_BASE64, "PNG", pageWidth - margin - 48, 12, 48, 14);
  } catch (err) {
    console.warn("Could not render logo in PDF:", err);
  }

  // Document Title
  const titles: Record<string, string> = {
    INVOICE: "TAX INVOICE",
    QUOTATION: "FORMAL QUOTATION / ESTIMATE",
    ORDER_FORM: "OFFICIAL ORDER FORM",
    PAYMENT_RECEIPT: "OFFICIAL PAYMENT RECEIPT",
    REFUND: "CREDIT NOTE / REFUND"
  };

  const titleText = titles[data.documentType] || data.documentType || "INVOICE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(titleText, margin, 18);

  // Company Information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("TECHNEXT TECHNOLOGIES", margin, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Door No. 4/487, Pulpally, Wayanad, Kerala - 673579, India", margin, 29);
  doc.text("Email: info.technexttech@gmail.com  |  Phone: +91 85906 74531", margin, 33.5);

  // Horizontal divider
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(margin, 38, pageWidth - margin, 38);

  // 2. Client Info (Left) and Document Metadata (Right)
  const metaStartY = 44;

  // Left: Bill To Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const billToLabel = data.documentType === "QUOTATION" ? "QUOTATION FOR:" : data.documentType === "ORDER_FORM" ? "ORDERED BY:" : data.documentType === "PAYMENT_RECEIPT" ? "RECEIVED FROM:" : "BILL TO:";
  doc.text(billToLabel, margin, metaStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const clientName = data.customer.company || data.customer.name || "Customer";
  doc.text(clientName, margin, metaStartY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  let currentLeftY = metaStartY + 9.5;
  if (data.customer.address) {
    const splitAddr = doc.splitTextToSize(data.customer.address, 85);
    doc.text(splitAddr, margin, currentLeftY);
    currentLeftY += splitAddr.length * 4;
  }
  if (data.customer.phone) {
    doc.text(`Phone: ${data.customer.phone}`, margin, currentLeftY);
    currentLeftY += 4;
  }
  if (data.customer.email) {
    doc.text(`Email: ${data.customer.email}`, margin, currentLeftY);
    currentLeftY += 4;
  }
  const custCode = data.customer.customerNumber ? `TN-${data.customer.customerNumber}` : data.customer.aroniumCode ? `TN-${data.customer.aroniumCode}` : "TN-8779";
  doc.text(`Client ID: ${custCode}`, margin, currentLeftY);
  if (data.customer.gstNumber) {
    currentLeftY += 4;
    doc.text(`GSTIN: ${data.customer.gstNumber}`, margin, currentLeftY);
  }

  // Right: Metadata Box
  const rightColX = 120;
  const rightColWidth = pageWidth - margin - rightColX;

  // Background card for metadata
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, metaStartY - 2, rightColWidth, 34, 1.5, 1.5, "FD");

  const metaItems = [
    { label: "Document No.:", val: data.documentNumber },
    { label: "Document Date:", val: formatDate(data.date) },
    { label: data.documentType === "QUOTATION" ? "Valid Until:" : "Due Date:", val: formatDate(data.dueDate || data.date) },
    { label: "Payment Status:", val: data.paymentStatus || "Paid" },
    { label: "Payment Mode:", val: data.paymentMethod || "UPI PAYMENT" },
  ];

  let metaY = metaStartY + 3.5;
  metaItems.forEach(item => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, rightColX + 3, metaY);

    doc.setFont("helvetica", item.label === "Document No.:" ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(item.val === "Refunded" ? 220 : 15, item.val === "Refunded" ? 38 : 23, item.val === "Refunded" ? 38 : 42);
    doc.text(item.val, rightColX + 34, metaY);
    metaY += 5.5;
  });

  // Table Start Y
  const tableStartY = Math.max(currentLeftY + 6, metaStartY + 36);

  // 3. Line Items AutoTable
  const headers = [["#", "Item Description", "Qty", "Unit Price (₹)", "Tax Rate", "Discount", "Total (₹)"]];
  const tableRows = (data.items || []).map((it, idx) => [
    String(idx + 1),
    it.name + (it.description ? `\n${it.description}` : ""),
    String(it.quantity || 1),
    `₹${formatCurrency(it.unitPrice)}`,
    it.tax || "18%",
    it.discount ? String(it.discount) : "---",
    `₹${formatCurrency(it.total)}`
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: headers,
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 40;

  // 4. Financial Summary Block (Right) & Bank Details (Left)
  let bottomY = finalY + 6;

  // Left: Bank & Split Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Official Settlement & Bank Details:", margin, bottomY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Bank: South Indian Bank, Pulpally Branch", margin, bottomY + 7);
  doc.text("Account Name: TechNext Technologies", margin, bottomY + 11.5);
  doc.text("Account Number: 0256073000000123  |  IFSC: SIBL0000256", margin, bottomY + 16);
  doc.text("UPI Payment: technext@upi / +91 85906 74531", margin, bottomY + 20.5);

  if (data.creditTerms) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text(`Credit Terms: ${data.creditTerms} (Due: ${formatDate(data.creditDueDate)})`, margin, bottomY + 26);
  }

  // Right: Calculation Summary Table
  const calcBoxX = 125;
  const calcBoxWidth = pageWidth - margin - calcBoxX;

  const subtotal = data.subtotal !== undefined ? data.subtotal : data.totalAmount;
  const totalDiscount = data.totalDiscount || 0;
  const totalAmount = data.totalAmount;
  const paidAmount = data.paidAmount !== undefined ? data.paidAmount : (data.paymentStatus === "Paid" ? totalAmount : 0);
  const amountDue = data.amountDue !== undefined ? data.amountDue : Math.max(0, totalAmount - paidAmount);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(calcBoxX, bottomY - 2, calcBoxWidth, 36, 1.5, 1.5, "FD");

  const calcLines = [
    { label: "Subtotal:", val: `₹${formatCurrency(subtotal)}`, bold: false },
    { label: "Discount:", val: totalDiscount > 0 ? `-₹${formatCurrency(totalDiscount)}` : "₹0.00", bold: false },
    { label: "Grand Total:", val: `₹${formatCurrency(totalAmount)}`, bold: true, color: [15, 23, 42] },
    { label: "Amount Paid:", val: `₹${formatCurrency(paidAmount)}`, bold: false, color: [22, 101, 52] },
    { label: "Balance Due:", val: `₹${formatCurrency(amountDue)}`, bold: true, color: amountDue > 0 ? [220, 38, 38] : [15, 23, 42] },
  ];

  let calcLineY = bottomY + 3.5;
  calcLines.forEach(l => {
    doc.setFont("helvetica", l.bold ? "bold" : "normal");
    doc.setFontSize(l.bold ? 9 : 8);
    doc.setTextColor(71, 85, 105);
    doc.text(l.label, calcBoxX + 4, calcLineY);

    if (l.color) {
      doc.setTextColor(l.color[0], l.color[1], l.color[2]);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(l.val, calcBoxX + calcBoxWidth - 4, calcLineY, { align: "right" });
    calcLineY += 6;
  });

  // 5. Payment Schedule Table (If Multi-Date installments exist)
  let nextSectionY = bottomY + 40;
  if (data.paymentSchedule && data.paymentSchedule.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Multi-Date Payment Schedule & Installments Ledger:", margin, nextSectionY);

    const scheduleHeaders = [["#", "Payment Date", "Method", "Milestone / Reference", "Status", "Amount (₹)"]];
    const scheduleRows = data.paymentSchedule.map((p, idx) => [
      String(idx + 1),
      formatDate(p.date),
      p.method || "UPI",
      p.reference || "Milestone installment",
      p.status || "PAID",
      `₹${formatCurrency(p.amount)}`
    ]);

    autoTable(doc, {
      startY: nextSectionY + 3,
      margin: { left: margin, right: margin },
      head: scheduleHeaders,
      body: scheduleRows,
      theme: "plain",
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 26 },
        2: { cellWidth: 24 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      }
    });

    nextSectionY = (doc as any).lastAutoTable?.finalY || nextSectionY + 25;
  }

  // 6. Signatures and Authorization
  const signY = Math.min(Math.max(nextSectionY + 12, pageHeight - 46), pageHeight - 35);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, signY, margin + 55, signY);
  doc.line(pageWidth - margin - 55, signY, pageWidth - margin, signY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Client Acceptance Signature", margin, signY + 4);
  doc.text("Authorized Signatory", pageWidth - margin - 55, signY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, margin, signY + 8);
  doc.text("TechNext Technologies", pageWidth - margin - 55, signY + 8);

  // 7. Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("TechNext Technologies • Enterprise Billing & ERP System • www.technexttechnologies.in", margin, pageHeight - 10);
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 10, { align: "right" });

  // Save the vector PDF file directly
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
