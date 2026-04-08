export const supportTemplate = (
	email: string,
	ticketId: string,
	subject: string,
): string => {
	return `
	<!DOCTYPE html>
	<html>
	<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
		<div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">
			<h2 style="color:#1e90ff; text-align:center;">Support Ticket Update</h2>
			<p>Hello ${email},</p>
			<p>We have received an update on your support request.</p>
			<p><strong>Ticket ID:</strong> ${ticketId}</p>
			<p><strong>Subject:</strong> ${subject}</p>
			<p>You can review updates in your dashboard issues section.</p>
			<p style="margin-top:24px;">Regards,<br/><strong>Team BookMyTrip</strong></p>
		</div>
	</body>
	</html>
	`;
};
