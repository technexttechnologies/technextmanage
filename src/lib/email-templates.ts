export const templates = {
  // 1. New Lead Notification (Admin)
  newLeadNotification: (lead: any) => `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; display: inline-block;">New Website Enquiry</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;" width="30%">Name</td><td style="padding: 10px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${lead.name}</td></tr>
        <tr><td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Email</td><td style="padding: 10px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${lead.email || 'N/A'}</td></tr>
        <tr><td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Phone</td><td style="padding: 10px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${lead.phone || 'N/A'}</td></tr>
        <tr><td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Source</td><td style="padding: 10px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${lead.source}</td></tr>
        <tr><td style="padding: 10px 0; color: #64748b; font-size: 14px;">Notes</td><td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${lead.notes || 'None'}</td></tr>
      </table>
    </div>
    <p style="color: #475569; font-size: 15px;">Please assign this lead and follow up as soon as possible.</p>
  `,

  // 2. Lead Acknowledgement (Customer)
  leadAcknowledgement: (lead: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Thank you for reaching out, ${lead.name}!</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We have successfully received your enquiry. At <strong>technext</strong>, we pride ourselves on delivering premium technology solutions tailored to your unique needs.</p>
    <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 12px 12px 0; margin: 30px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps</h3>
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">One of our technical experts will review your request and get back to you within <strong>24 business hours</strong>.</p>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">In the meantime, feel free to explore our <a href="https://technexttechnologies.com/portfolio" style="color: #4f46e5; font-weight: 600;">portfolio</a> or reply to this email with any additional details.</p>
  `,

  // 3. Quotation Email
  quotationEmail: (quote: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Your Official Quotation is Ready</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${quote.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Based on our recent discussions, we have prepared a detailed quotation for your project.</p>
    
    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Quotation No:</td><td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${quote.quotationNumber}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Total Investment:</td><td style="padding: 8px 0; color: #4f46e5; font-size: 18px; font-weight: 700;">₹${quote.totalAmount.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 40%;">Validity:</td><td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">15 Days</td></tr>
      </table>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Please click the button below to download the full PDF and review the terms.</p>
  `,

  // 4. Proposal Submission
  proposalSubmission: (proposal: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Project Proposal: ${proposal.projectName}</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${proposal.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Thank you for the opportunity to propose our solution for your business. We have carefully analyzed your requirements and crafted a comprehensive strategy to help you achieve your goals.</p>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 24px; margin: 30px 0;">
      <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px;">Proposal Highlights</h3>
      <ul style="color: #475569; font-size: 15px; line-height: 1.6; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 8px;">Tailored architectural design</li>
        <li style="margin-bottom: 8px;">Clear milestone-driven timeline</li>
        <li style="margin-bottom: 0;">Scalability and performance focus</li>
      </ul>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We would love to schedule a quick call to walk you through the details and answer any questions.</p>
  `,

  // 5. Invoice Email
  invoiceEmail: (invoice: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Invoice #${invoice.invoiceNumber}</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${invoice.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We hope you are satisfied with our recent services. Attached to this email is your invoice for the recent project milestones.</p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Amount Due</p>
      <p style="margin: 0; font-size: 32px; color: #0f172a; font-weight: 800;">₹${invoice.amount.toLocaleString()}</p>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #ef4444; font-weight: 600;">Due By: ${invoice.dueDate}</p>
      </div>
    </div>
  `,

  // 6. Payment Confirmation
  paymentConfirmation: (payment: any) => `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #dcfce7; width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="color: #16a34a; font-size: 32px;">✓</span>
      </div>
      <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Payment Received</h2>
      <p style="font-size: 16px; color: #64748b; margin: 0;">Thank you for your prompt payment.</p>
    </div>
    
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #f1f5f9;">Receipt No:</td><td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${payment.receiptNo}</td></tr>
        <tr><td style="padding: 12px 0; color: #64748b; font-size: 15px; border-bottom: 1px solid #f1f5f9;">Amount Paid:</td><td style="padding: 12px 0; color: #16a34a; font-size: 15px; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${payment.amount.toLocaleString()}</td></tr>
        <tr><td style="padding: 12px 0; color: #64748b; font-size: 15px;">Date:</td><td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${payment.date}</td></tr>
      </table>
    </div>
  `,

  // 7. Project Kickoff
  projectKickoff: (project: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Welcome Aboard! 🚀</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We are thrilled to officially kick off <strong>${project.name}</strong>!</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Our team is fully prepped and ready to transform your vision into reality. Below are your dedicated project manager's details who will be your primary point of contact.</p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 20px; margin: 30px 0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; text-transform: uppercase;">Project Manager</p>
      <p style="margin: 0 0 4px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${project.managerName}</p>
      <p style="margin: 0; color: #4f46e5; font-size: 15px; font-weight: 500;">${project.managerEmail}</p>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We'll be sending you regular updates throughout the project lifecycle. Let's build something amazing!</p>
  `,

  // 8. Project Progress Update
  projectProgressUpdate: (project: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Project Update: ${project.name}</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We wanted to share a quick update on our progress.</p>
    
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span style="color: #0f172a; font-weight: 600; font-size: 15px;">Overall Progress</span>
        <span style="color: #4f46e5; font-weight: 700; font-size: 15px;">${project.progress}%</span>
      </div>
      <div style="width: 100%; background-color: #f1f5f9; border-radius: 999px; height: 12px; overflow: hidden;">
        <div style="width: ${project.progress}%; background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%); height: 100%; border-radius: 999px;"></div>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0;">Recently Completed:</h3>
      <ul style="color: #475569; font-size: 15px; line-height: 1.6; padding-left: 20px; margin: 0;">
        ${project.completedTasks.map((t: string) => `<li style="margin-bottom: 8px;">${t}</li>`).join('')}
      </ul>
    </div>
  `,

  // 9. Project Completion
  projectCompletion: (project: any) => `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 28px; font-weight: 800;">Mission Accomplished! 🎉</h2>
      <p style="font-size: 16px; color: #64748b; margin: 0; line-height: 1.6;">We are thrilled to announce the successful completion of <strong>${project.name}</strong>.</p>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">All deliverables have been finalized, tested, and deployed as per our agreement. It has been an absolute pleasure working with you on this project.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">We would greatly appreciate your feedback on the experience.</p>
      <a href="https://g.page/r/technext" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Leave a Review</a>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">If you are interested in an Annual Maintenance Contract (AMC) for ongoing support, please let us know!</p>
  `,

  // 10. Support Ticket Created
  supportTicketCreated: (ticket: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Support Ticket Received</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Hello ${ticket.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We have successfully received your support request. A ticket has been created and assigned to our technical team.</p>
    
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px; width: 35%;">Ticket ID:</td><td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">#${ticket.id}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px;">Subject:</td><td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 600;">${ticket.subject}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 15px;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; ${ticket.priority === 'URGENT' ? 'background: #fee2e2; color: #b91c1c;' : 'background: #e0e7ff; color: #4338ca;'}">${ticket.priority}</span>
            </td>
        </tr>
      </table>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We will investigate this issue and get back to you shortly.</p>
  `,

  // 11. Support Resolution
  supportResolution: (ticket: any) => `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #dcfce7; width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="color: #16a34a; font-size: 28px;">✓</span>
      </div>
      <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">Issue Resolved</h2>
      <p style="font-size: 16px; color: #64748b; margin: 0;">Ticket #${ticket.id} has been closed.</p>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">We're happy to inform you that your support ticket regarding <strong>"${ticket.subject}"</strong> has been successfully resolved.</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">Resolution Notes</h4>
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">${ticket.resolutionNotes || 'The issue has been completely fixed and verified by our engineering team.'}</p>
    </div>
    
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">If you continue to experience issues, you can reply directly to this email to reopen the ticket.</p>
  `,

  // 12. Appointment Confirmation
  appointmentConfirmation: (appointment: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Meeting Confirmed</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Hello ${appointment.name},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Your appointment has been successfully scheduled. We look forward to speaking with you!</p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px; text-transform: uppercase;">Date & Time</p>
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">${appointment.dateTime}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 16px;">
            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px; text-transform: uppercase;">Type</p>
            <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">${appointment.type}</p>
          </td>
        </tr>
      </table>
    </div>
  `,

  // 13. Follow-Up Email Sequence
  followUpSequence: (data: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Checking in, ${data.name}</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">I wanted to follow up regarding our previous conversation. We are very interested in partnering with you to elevate your business's digital presence.</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Are you available for a brief 10-minute chat this week to discuss how our custom software solutions can drive immediate value for your team?</p>
  `,

  // 14. Marketing Campaign
  marketingCampaign: (campaign: any) => `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 800; line-height: 1.3;">${campaign.headline}</h2>
      <p style="font-size: 18px; color: #475569; margin: 0; line-height: 1.6;">${campaign.subheadline}</p>
    </div>
    
    <div style="background: #ffffff; border-radius: 12px; overflow: hidden; margin: 30px 0;">
      ${campaign.imageUrl ? `<img src="${campaign.imageUrl}" alt="Campaign Image" style="width: 100%; height: auto; display: block;" />` : ''}
    </div>
    
    <div style="font-size: 16px; color: #334155; line-height: 1.8;">
      ${campaign.bodyContent}
    </div>
  `,

  // 15. Newsletter
  newsletter: (data: any) => `
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 6px 12px; border-radius: 999px; margin-bottom: 16px;">TechNext Monthly</span>
      <h2 style="color: #0f172a; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">The Tech Innovator</h2>
    </div>
    
    <div style="font-size: 16px; color: #334155; line-height: 1.8;">
      ${data.content}
    </div>
    
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
      <h3 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Latest from the Blog</h3>
      ${data.articles.map((a: any) => `
        <div style="margin-bottom: 24px;">
          <a href="${a.url}" style="color: #4f46e5; text-decoration: none; font-size: 18px; font-weight: 600; display: block; margin-bottom: 6px;">${a.title}</a>
          <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.6;">${a.excerpt}</p>
        </div>
      `).join('')}
    </div>
  `,

  // 16. Package Activation
  packageActivation: (pkg: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Service Package Activated</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${pkg.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Your <strong>${pkg.packageName}</strong> (${pkg.packageType}) has been successfully activated.</p>
    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <p style="margin: 0; color: #0f172a; font-weight: 600;">Status: Active</p>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Our assigned team will be in touch shortly to begin the necessary provisioning.</p>
  `,

  // 17. Domain Registration
  domainActivation: (domain: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Domain Registration Confirmed</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${domain.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Great news! Your domain name <strong>${domain.domainName}</strong> has been successfully registered.</p>
    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <p style="margin: 0; color: #0f172a; font-weight: 600;">Registrar: ${domain.registrar}</p>
      <p style="margin: 8px 0 0 0; color: #475569;">Expiry Date: ${domain.expiryDate}</p>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">You will receive automated reminders when it is time to renew. Please review your Client Portal to manage DNS records if needed.</p>
  `,

  // 18. Hosting Provisioning
  hostingActivation: (host: any) => `
    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">Hosting Provisioned</h2>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Dear ${host.customerName},</p>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Your hosting environment is now live and fully configured.</p>
    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <p style="margin: 0; color: #0f172a; font-weight: 600;">Plan: ${host.hostingPlan}</p>
      <p style="margin: 8px 0 0 0; color: #475569;">Provider: ${host.hostingProvider}</p>
    </div>
    <p style="font-size: 16px; color: #334155; line-height: 1.7;">Your SSL Certificates and automated backups have been successfully enabled. The server details will be securely communicated to you shortly.</p>
  `
};
