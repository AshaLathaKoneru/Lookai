import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
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
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground text-sm">
          Last updated: January 24, 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By downloading, installing, or using LooKai ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            LooKai is an AI-powered calorie and nutrition tracking application that allows users to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
            <li>Scan food using their device camera for nutritional analysis</li>
            <li>Track daily calorie and macro intake</li>
            <li>Set and monitor health and fitness goals</li>
            <li>View insights and trends about their nutrition</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. User Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            To use certain features of the App, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Accuracy of Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            While we strive to provide accurate nutritional information through our AI analysis, calorie and macro estimates are approximations and should not be used as the sole basis for medical or dietary decisions. Always consult with healthcare professionals for personalized nutrition advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
            <li>Use the App for any unlawful purpose</li>
            <li>Attempt to reverse engineer or hack the App</li>
            <li>Upload inappropriate or offensive content</li>
            <li>Interfere with the proper functioning of the App</li>
            <li>Share your account with others</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Subscription and Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            LooKai offers both free and premium subscription tiers. Premium features require a paid subscription. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Refunds are subject to the policies of the respective app store.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The App, including its design, features, content, and underlying technology, is owned by LooKai and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. User Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of content you upload (such as food photos). By uploading content, you grant us a license to use it for providing and improving our services, including AI training to improve nutritional analysis accuracy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE APP WILL BE ERROR-FREE, UNINTERRUPTED, OR THAT NUTRITIONAL ESTIMATES WILL BE 100% ACCURATE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOOKAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">11. Health Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed">
            LooKai is not a medical device and should not replace professional medical advice. If you have specific dietary needs, allergies, or health conditions, consult a healthcare provider before making dietary changes based on App recommendations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">12. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate your account if you violate these Terms. You may delete your account at any time through the App settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">13. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">14. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by the laws of the jurisdiction in which LooKai operates, without regard to conflict of law principles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">15. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these Terms, please contact us at support@lookai.app
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
