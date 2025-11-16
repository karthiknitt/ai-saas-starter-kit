/**
 * Email template for failed payment
 * Sent when a payment fails to process
 */

import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface PaymentFailureEmailProps {
	username: string;
	planName: string;
	amount: string;
	failureReason?: string;
	retryDate?: string;
}

export default function PaymentFailureEmail({
	username,
	planName,
	amount,
	failureReason,
	retryDate,
}: PaymentFailureEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Action Required: Payment Failed</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>Payment Failed ⚠️</Heading>

					<Text style={text}>Hi {username},</Text>

					<Text style={text}>
						We were unable to process your recent payment for your {planName}{" "}
						subscription. Your subscription may be interrupted if this issue
						isn't resolved.
					</Text>

					<Section style={failureDetails}>
						<Text style={detailLabel}>Payment Information:</Text>
						<Text style={detailInfo}>
							<strong>Plan:</strong> {planName}
						</Text>
						<Text style={detailInfo}>
							<strong>Amount:</strong> {amount}
						</Text>
						{failureReason && (
							<Text style={detailInfo}>
								<strong>Reason:</strong> {failureReason}
							</Text>
						)}
						{retryDate && (
							<Text style={detailInfo}>
								<strong>Next Retry:</strong> {retryDate}
							</Text>
						)}
					</Section>

					<Text style={text}>
						<strong>What you can do:</strong>
					</Text>

					<Section style={actionList}>
						<Text style={actionItem}>
							1. Check that your payment method is valid and has sufficient
							funds
						</Text>
						<Text style={actionItem}>
							2. Update your payment information in your billing dashboard
						</Text>
						<Text style={actionItem}>
							3. Contact your bank if you believe this is an error
						</Text>
					</Section>

					<Section style={buttonSection}>
						<Link
							href={`${process.env.BETTER_AUTH_URL}/billing`}
							style={button}
						>
							Update Payment Method
						</Link>
					</Section>

					<Text style={warningText}>
						{retryDate
							? `We'll automatically retry the payment on ${retryDate}. If the payment continues to fail, your subscription may be canceled.`
							: "Please update your payment information as soon as possible to avoid service interruption."}
					</Text>

					<Text style={footer}>
						If you need assistance, please contact our support team.
						<br />
						<br />
						Best regards,
						<br />
						The Team
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const h1 = {
	color: "#d32f2f",
	fontSize: "24px",
	fontWeight: "bold",
	margin: "40px 0",
	padding: "0 48px",
};

const text = {
	color: "#333",
	fontSize: "16px",
	lineHeight: "26px",
	padding: "0 48px",
	margin: "16px 0",
};

const failureDetails = {
	backgroundColor: "#ffebee",
	borderRadius: "8px",
	margin: "24px 48px",
	padding: "24px",
	borderLeft: "4px solid #d32f2f",
};

const detailLabel = {
	color: "#c62828",
	fontSize: "14px",
	fontWeight: "bold",
	textTransform: "uppercase" as const,
	marginBottom: "16px",
};

const detailInfo = {
	color: "#333",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "8px 0",
};

const actionList = {
	padding: "0 48px",
	margin: "16px 0",
};

const actionItem = {
	color: "#333",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "8px 0",
};

const buttonSection = {
	padding: "0 48px",
	margin: "24px 0",
};

const button = {
	backgroundColor: "#d32f2f",
	borderRadius: "6px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 20px",
};

const warningText = {
	backgroundColor: "#fff3e0",
	color: "#e65100",
	fontSize: "14px",
	lineHeight: "22px",
	padding: "16px 48px",
	margin: "24px 48px",
	borderRadius: "6px",
	borderLeft: "4px solid #ff9800",
};

const footer = {
	color: "#666",
	fontSize: "14px",
	lineHeight: "24px",
	padding: "0 48px",
	margin: "24px 0 16px",
};
