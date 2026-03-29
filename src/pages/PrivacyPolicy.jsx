import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      {/* Back Nav */}
      <div className="border-b border-emerald-500/20 bg-emerald-950/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-white/80">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
          <p>
            Welcome to FloraSonics ("we", "our", or "us"). We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you use our application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white">Account Information:</strong> Email address and display name when you register.</li>
            <li><strong className="text-white">Usage Data:</strong> Sounds played, presets saved, wellness activity sessions, and app interactions.</li>
            <li><strong className="text-white">Mood & Wellness Logs:</strong> Mood entries and wellness data you voluntarily log.</li>
            <li><strong className="text-white">Payment Information:</strong> Processed securely by Stripe. We do not store your card details.</li>
            <li><strong className="text-white">Device Data:</strong> Browser type, device type, and general location (country/region).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To provide and improve the FloraSonics service.</li>
            <li>To personalize your experience with sound recommendations and wellness insights.</li>
            <li>To process subscription payments via Stripe.</li>
            <li>To send transactional emails (e.g., subscription confirmations).</li>
            <li>To analyze usage patterns and improve app performance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share data with trusted third-party services
            only as needed to operate FloraSonics:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white">Stripe</strong> — for payment processing.</li>
            <li><strong className="text-white">Base44</strong> — our backend infrastructure provider.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion of your
            account and associated data at any time from the Settings page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. Payment data is
            handled exclusively by Stripe, which is PCI-DSS compliant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Opt out of non-essential communications.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Cookies</h2>
          <p>
            FloraSonics uses essential cookies for authentication and session management. No third-party
            advertising cookies are used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Children's Privacy</h2>
          <p>
            FloraSonics is not intended for children under 13. We do not knowingly collect data from
            children under 13.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:support@florasonics.com" className="text-emerald-400 hover:underline">
              support@florasonics.com
            </a>
          </p>
        </section>

        <hr className="border-white/10" />

        {/* Terms of Service */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By using FloraSonics, you agree to these Terms of Service. If you do not agree, please do
            not use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Use of Service</h2>
          <p>
            FloraSonics is a wellness and ambient sound application. You agree to use it only for lawful
            purposes and not to misuse, reverse-engineer, or disrupt the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Subscriptions & Payments</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Subscriptions are billed on a recurring basis (monthly or annually).</li>
            <li>You may cancel your subscription at any time from the Settings page.</li>
            <li>Refunds are handled on a case-by-case basis. Contact support for assistance.</li>
            <li>Payments are securely processed by Stripe.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. User Content</h2>
          <p>
            You retain ownership of content you create (e.g., presets, journal entries). By using
            FloraSonics, you grant us a limited license to store and display your content within the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Disclaimer</h2>
          <p>
            FloraSonics is provided "as is" without warranties of any kind. It is a wellness tool and
            is not a substitute for professional medical or mental health advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, FloraSonics shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of FloraSonics after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Contact</h2>
          <p>
            For any questions regarding these terms, contact us at:{" "}
            <a href="mailto:support@florasonics.com" className="text-emerald-400 hover:underline">
              support@florasonics.com
            </a>
          </p>
        </section>

        <div className="pt-6 pb-10 text-center text-white/30 text-sm">
          © 2026 FloraSonics. All rights reserved.
        </div>
      </div>
    </div>
  );
}