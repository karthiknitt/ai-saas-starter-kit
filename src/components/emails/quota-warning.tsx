/**
 * Email template for usage quota warnings
 * Sent when users reach 80%, 90%, or 100% of their quota
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

interface QuotaWarningEmailProps {
	username: string;
	planName: string;
	usagePercentage: number;
	quotaUsed: number;
	quotaLimit: number;
	resetDate: string;
}

export default function QuotaWarningEmail({
	username,
	planName,
	usagePercentage,
	quotaUsed,
	quotaLimit,
	resetDate,
}: QuotaWarningEmailProps) {
	const isAtLimit = usagePercentage >= 100;
	const isNearLimit = usagePercentage >= 90;

	return (
		<Html>
			<Head />
			<Preview>
				{isAtLimit
					? "You've reached your usage limit"
					: `You've used ${usagePercentage}% of your quota`}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>
						{isAtLimit ? "Usage Limit Reached 🚫" : "Usage Warning ⚠️"}
					</Heading>

					<Text style={text}>Hi {username},</Text>

					<Text style={text}>
						{isAtLimit
							? `You've reached 100% of your ${planName} plan's monthly usage limit.`
							: `You've used ${usagePercentage}% of your ${planName} plan's monthly usage limit.`}
					</Text>

					<Section style={usageDetails(usagePercentage)}>
						<Text style={detailLabel}>Usage Details:</Text>
						<Text style={detailInfo}>
							<strong>Current Usage:</strong> {quotaUsed} / {quotaLimit} requests
						</Text>
						<Text style={detailInfo}>
							<strong>Usage:</strong> {usagePercentage}%
						</Text>
						<Text style={detailInfo}>
							<strong>Resets On:</strong> {resetDate}
						</Text>
					</Section>

					{isAtLimit ? (
						<>
							<Text style={warningText}>
								<strong>Your access is currently limited.</strong> To continue
								using our service without interruption, please upgrade your
								plan or wait until your quota resets on {resetDate}.
							</Text>

							<Section style={buttonSection}>
								<Link
									href={`${process.env.BETTER_AUTH_URL}/dashboard/subscriptions`}
									style={button}
								>
									Upgrade Your Plan
								</Link>
							</Section>
						</>
					) : (
						<>
							<Text style={text}>
								{isNearLimit
									? "You're running low on requests. Consider upgrading your plan to avoid service interruption."
									: "We wanted to give you a heads up about your usage. You may want to upgrade your plan if you need more requests this month."}
							</Text>

							<Section style={buttonSection}>
								<Link
									href={`${process.env.BETTER_AUTH_URL}/dashboard/subscriptions`}
									style={button}
								>
									View Upgrade Options
								</Link>
							</Section>

							<Section style={buttonSection}>
								<Link
									href={`${process.env.BETTER_AUTH_URL}/billing`}
									style={secondaryButton}
								>
									View Usage Dashboard
								</Link>
							</Section>
						</>
					)}

					<Text style={footer}>
						Need help choosing the right plan? Contact our support team.
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

const usageDetails = (percentage: number) => ({
	backgroundColor: percentage >= 100 ? "#ffebee" : "#fff3e0",
	borderRadius: "8px",
	margin: "24px 48px",
	padding: "24px",
	borderLeft: `4px solid ${percentage >= 100 ? "#d32f2f" : "#ff9800"}`,
});

const detailLabel = {
	color: "#666",
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

const buttonSection = {
	padding: "0 48px",
	margin: "16px 0",
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

const secondaryButton = {
	backgroundColor: "#fff",
	border: "1px solid #ddd",
	borderRadius: "6px",
	color: "#333",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "12px 20px",
};

const warningText = {
	backgroundColor: "#ffebee",
	color: "#c62828",
	fontSize: "15px",
	lineHeight: "24px",
	padding: "16px 48px",
	margin: "24px 48px",
	borderRadius: "6px",
	borderLeft: "4px solid #d32f2f",
};

const footer = {
	color: "#666",
	fontSize: "14px",
	lineHeight: "24px",
	padding: "0 48px",
	margin: "24px 0 16px",
};
