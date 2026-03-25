import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, orgName, role, inviteToken } = await req.json();

    if (!email || !orgName || !role || !inviteToken) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build the invite link
    const inviteLink = `${Deno.env.get('BASE44_APP_URL')}/accept-invite?token=${inviteToken}`;

    // Send the email
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `You've been invited to join ${orgName} on KYC Confidence`,
      body: `Hi,\n\nYou've been invited to join ${orgName} as a ${role} on KYC Confidence.\n\nAccept your invitation here: ${inviteLink}\n\nIf you have any questions, please contact your administrator.\n\nBest regards,\nKYC Confidence Team`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending invite email:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});