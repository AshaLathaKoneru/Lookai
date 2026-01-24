import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground text-sm">
          Last updated: January 24, 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to LooKai ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
            <li>Account information (email address, name)</li>
            <li>Profile data (dietary preferences, health goals, calorie targets)</li>
            <li>Food and meal data (photos, nutritional information you log)</li>
            <li>Usage data (how you interact with the app)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Analyze your food photos to estimate nutritional content</li>
            <li>Track your calorie and macro intake</li>
            <li>Personalize your experience based on your goals</li>
            <li>Send you updates and notifications (with your consent)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Data Storage and Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is securely stored using industry-standard encryption. We use secure cloud infrastructure to protect your personal information. Food images are processed for nutritional analysis and may be stored to improve our AI accuracy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Camera and Photo Access</h2>
          <p className="text-muted-foreground leading-relaxed">
            LooKai requires camera access to scan and analyze your meals. Photos are used solely for nutritional analysis and are not shared with third parties for advertising purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may use third-party services for analytics, authentication, and AI processing. These services have their own privacy policies governing the use of your information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            LooKai is not intended for children under 13. We do not knowingly collect personal information from children under 13 years of age.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at support@lookai.app
          </p>
        </section>

        <div className="pt-6 pb-20">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 LooKai. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
