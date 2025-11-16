/**
 * Email template for subscription confirmation
 * Sent when a user successfully subscribes to a plan
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

interface SubscriptionConfirmationEmailProps {
	username: string;
	planName: string;
	billingCycle: string;
	nextBillingDate: string;
	amount: string;
}

export default function SubscriptionConfirmationEmail({
	username,
	planName,
	billingCycle,
	nextBillingDate,
	amount,
}: SubscriptionConfirmationEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>
				Welcome to {planName}! Your subscription is now active.
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>Subscription Confirmed 🎉</Heading>

					<Text style={text}>Hi {username},</Text>

					<Text style={text}>
						Thank you for subscribing to the <strong>{planName}</strong> plan!
						Your subscription is now active and you have access to all the
						features included in your plan.
					</Text>

					<Section style={planDetails}>
						<Text style={planLabel}>Plan Details:</Text>
						<Text style={planInfo}>
							<strong>Plan:</strong> {planName}
						</Text>
						<Text style={planInfo}>
							<strong>Billing Cycle:</strong> {billingCycle}
						</Text>
						<Text style={planInfo}>
							<strong>Amount:</strong> {amount}
						</Text>
						<Text style={planInfo}>
							<strong>Next Billing Date:</strong> {nextBillingDate}
						</Text>
					</Section>

					<Section style={buttonSection}>
						<Link
							href={`${process.env.BETTER_AUTH_URL}/billing`}
							style={button}
						>
							View Billing Dashboard
						</Link>
					</Section>

					<Text style={text}>
						You can manage your subscription, view usage, and update payment
						methods from your billing dashboard at any time.
					</Text>

					<Text style={footer}>
						If you have any questions, please don't hesitate to reach out to our
						support team.
					</Text>

					<Text style={footer}>
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
	color: "#333",
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

const planDetails = {
	backgroundColor: "#f8f9fa",
	borderRadius: "8px",
	margin: "24px 48px",
	padding: "24px",
};

const planLabel = {
	color: "#666",
	fontSize: "14px",
	fontWeight: "bold",
	textTransform: "uppercase" as const,
	marginBottom: "16px",
};

const planInfo = {
	color: "#333",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "8px 0",
};

const buttonSection = {
	padding: "0 48px",
	margin: "32px 0",
};

const button = {
	backgroundColor: "#000",
	borderRadius: "6px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 20px",
};

const footer = {
	color: "#666",
	fontSize: "14px",
	lineHeight: "24px",
	padding: "0 48px",
	margin: "16px 0",
};
