export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PortalHeader } from "../../PortalHeader";
import { FileText, Download, Receipt } from "lucide-react";
import { format } from "date-fns";
import { InvoicePaymentButton } from "./InvoicePaymentButton";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";

export default async function InvoicePortalPage({ params }: { params: Promise<{ token: string, id: string }> }) {
  const { token, id } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token }
  });

  if (!customer) return notFound();

  const invoice = await prisma.invoiceRequest.findFirst({
    where: { 
      id: id,
      customerId: customer.id
    }
  });

  if (!invoice) return notFound();

  const structured = (invoice.structuredData as any) || {};
  const total = Number(structured.totalAmount !== undefined ? structured.totalAmount : invoice.amountRequested || 0);
  const paid = Number(structured.paidAmount || (invoice.status === "PAID" ? total : 0));
  const amountDue = Number(structured.amountDue !== undefined ? structured.amountDue : Math.max(0, total - paid));
  const invoiceDocNo = invoice.aroniumInvoiceNo || `INV-${invoice.id.slice(-6).toUpperCase()}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PortalHeader customer={customer} token={token} backLink={true} />

        <div style={{ backgroundColor: 'var(--surface-card)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '12px', borderRadius: '12px' }}>
                <Receipt size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {invoice.aroniumInvoiceNo || `INV-${invoice.id.slice(-6).toUpperCase()}`}
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Date: {format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <span style={{ 
              backgroundColor: invoice.status === 'PAID' ? 'var(--color-success-bg)' : invoice.status === 'UNDER_REVIEW' ? 'var(--color-warning-bg)' : 'var(--color-info-bg)', 
              color: invoice.status === 'PAID' ? 'var(--color-success)' : invoice.status === 'UNDER_REVIEW' ? 'var(--color-warning)' : 'var(--color-info)', 
              padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' 
            }}>
              {invoice.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-background)', borderRadius: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Total Amount</span>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>₹{total.toFixed(2)}</span>
            </div>
            {paid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <span style={{ color: '#065f46', fontWeight: '600' }}>Paid So Far</span>
                <span style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>₹{paid.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px', backgroundColor: amountDue > 0 ? '#fef2f2' : 'var(--surface-border)', borderRadius: '12px', border: amountDue > 0 ? '1px solid #fecaca' : 'none' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: amountDue > 0 ? '#991b1b' : 'var(--text-primary)' }}>
                {amountDue > 0 ? "Balance Due" : "Total Paid"}
              </span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: amountDue > 0 ? '#dc2626' : 'var(--brand-primary)' }}>
                ₹{(amountDue > 0 ? amountDue : total).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <a 
              href={`/request/invoice/${invoice.id}`}
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none' }}
            >
              <Receipt size={18} />
              View &amp; Print Official Bill
            </a>

            {invoice.pdfUrl && (
              <a 
                href={formatPdfUrl(invoice.pdfUrl)} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-border)', color: 'var(--text-primary)', border: 'none', padding: '16px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none' }}
              >
                <Download size={18} />
                Download PDF
              </a>
            )}
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <InvoicePaymentButton 
                invoiceId={invoice.id} 
                token={token} 
                currentStatus={invoice.status} 
                amountDue={amountDue}
                totalAmount={total}
                invoiceNumber={invoiceDocNo}
                customerName={customer.name}
                customerPhone={customer.phone || undefined}
                customerEmail={customer.email || undefined}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
