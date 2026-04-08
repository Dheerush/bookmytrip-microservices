export const passwordResetSuccessTemplate = (email: string): string => {
	return `
	<!DOCTYPE html>
	<html>
	<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
		<div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">
			<h2 style="color:#1e90ff; text-align:center;">Password Updated Successfully</h2>
			<p>Hello ${email},</p>
			<p>Your BookMyTrip account password was changed successfully.</p>
			<p>If this was not you, please reset your password immediately and contact support.</p>
			<p style="margin-top:24px;">Regards,<br/><strong>Team BookMyTrip</strong></p>
		</div>
	</body>
	</html>
	`;
};
