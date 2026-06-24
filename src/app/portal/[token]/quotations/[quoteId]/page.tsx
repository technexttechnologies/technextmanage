export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PortalHeader } from "../../PortalHeader";
import { FileSignature, Download } from "lucide-react";
import { format } from "date-fns";
import { QuotationActionButtons } from "./QuotationActionButtons";
import { formatPdfUrl } from "@/lib/cloudinaryStorage";

export default async function QuotationPortalPage({ params }: { params: Promise<{ token: string, quoteId: string }> }) {
  const { token, quoteId } = await params;
  
  const customer = await prisma.customer.findUnique({
    where: { portalToken: token }
  });

  if (!customer) return notFound();

  const quote = await prisma.quotation.findFirst({
    where: { 
      id: quoteId,
      customerId: customer.id
    }
  });

  if (!quote) return notFound();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-background)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PortalHeader customer={customer} token={token} backLink={true} />

        <div style={{ backgroundColor: 'var(--surface-card)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--brand-primary)', color: 'white', padding: '12px', borderRadius: '12px' }}>
                <FileSignature size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {quote.quotationNumber || `QUOTE-${quote.id.slice(-6).toUpperCase()}`}
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Date: {format(new Date(quote.date), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <span style={{ 
              backgroundColor: quote.status === 'APPROVED' ? 'var(--color-success-bg)' : quote.status === 'REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-info-bg)', 
              color: quote.status === 'APPROVED' ? 'var(--color-success)' : quote.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-info)', 
              padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' 
            }}>
              {quote.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-background)', borderRadius: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Subtotal</span>
              <span style={{ fontWeight: '600' }}>₹{quote.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', backgroundColor: 'var(--surface-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Total Amount</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--brand-primary)' }}>₹{quote.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {quote.pdfUrl && (
              <a 
                href={formatPdfUrl(quote.pdfUrl)} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-border)', color: 'var(--text-primary)', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none' }}
              >
                <Download size={18} />
                Download PDF
              </a>
            )}
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <QuotationActionButtons quoteId={quote.id} token={token} currentStatus={quote.status} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
