interface BookingTemplateInput {
	bookingRef: string;
	title: string;
	status: 'confirmed' | 'cancelled';
	amount: number;
}

export const bookingTemplate = ({
	bookingRef,
	title,
	status,
	amount,
}: BookingTemplateInput): string => {
	const heading = status === 'confirmed' ? 'Booking Confirmed' : 'Booking Cancelled';
	const message =
		status === 'confirmed'
			? 'Your booking has been successfully confirmed.'
			: 'Your booking has been cancelled as requested.';

	return `
	<!DOCTYPE html>
	<html>
	<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
		<div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">
			<h2 style="color:#1e90ff; text-align:center;">${heading}</h2>
			<p>${message}</p>
			<p><strong>Booking Ref:</strong> ${bookingRef}</p>
			<p><strong>Trip:</strong> ${title}</p>
			<p><strong>Amount:</strong> Rs. ${Number(amount || 0).toLocaleString('en-IN')}</p>
			<p style="margin-top:24px;">Thanks,<br/><strong>Team BookMyTrip</strong></p>
		</div>
	</body>
	</html>
	`;
};
