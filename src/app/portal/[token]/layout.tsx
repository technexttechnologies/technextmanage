import { ClientChatWidget } from "./ClientChatWidget";

export default async function PortalLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ token: string }> 
}) {
  const { token } = await params;
  
  return (
    <>
      {children}
      <ClientChatWidget token={token} />
    </>
  );
}
