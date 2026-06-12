import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTemplates = [
  {
    name: "Welcome Onboarding",
    subject: "Welcome to TechNext CRM!",
    type: "EMAIL",
    body: `<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
  <div style="background: #2563EB; color: #fff; padding: 24px; text-align: center;">
    <h1 style="margin: 0;">Welcome, {{CustomerName}}!</h1>
  </div>
  <div style="padding: 24px;">
    <p>We are thrilled to have you onboard.</p>
    <p>Your account has been successfully setup and is ready to go.</p>
    <p>Best Regards,<br>The TechNext Team</p>
  </div>
</div>`
  },
  {
    name: "Quotation Follow-up",
    subject: "Following up on your quotation",
    type: "EMAIL",
    body: `<div style="font-family: sans-serif; color: #333; padding: 20px;">
  <p>Hi {{CustomerName}},</p>
  <p>I hope you're having a great week.</p>
  <p>I'm following up on the quotation we sent over recently. Do you have any questions or require any adjustments?</p>
  <p>Let me know how you'd like to proceed!</p>
  <p>Best,<br>TechNext Sales</p>
</div>`
  },
  {
    name: "WhatsApp Quick Hello",
    subject: null,
    type: "WHATSAPP",
    body: "Hi {{CustomerName}}, this is the TechNext Team. Just reaching out to see if you needed any assistance with your recent inquiry! Let us know."
  }
];

async function main() {
  console.log("Seeding default templates...");
  for (const t of defaultTemplates) {
    const exists = await prisma.messageTemplate.findFirst({ where: { name: t.name } });
    if (!exists) {
      await prisma.messageTemplate.create({ data: t });
      console.log(`Created: ${t.name}`);
    }
  }
  console.log("Done!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
