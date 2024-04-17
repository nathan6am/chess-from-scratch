import React from "react";
import { PanelHeader, SectionHeader, Anchor, Body } from "../base/Typography";
import Logo from "../base/Logo";
const Privacy: React.FC = () => {
  return (
    <div className="p-4">
      <Logo size="lg" />
      <br />
      <PanelHeader className="text-3xl">Privacy Policy</PanelHeader>
      <Body className="text-light-300 my-2">
        <em>Last Updated: April 17, 2024</em>
      </Body>
      <br />
      <Body>
        {`This is the privacy policy for next-chess.dev, and online chess site. Please read it carefully to understand how
        we collect, use, and protect your personal information.`}
      </Body>
      <br />
      <p>
        <strong>Questions or concerns?&nbsp;</strong>
        {`Reading this privacy notice will help you understand your privacy
        rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you
        still have any questions or concerns, please contact us at `}
        <a href="mailto:support@next-chess.dev" className="underline hover:text-gold-200">
          support@next-chess.dev
        </a>
        .
      </p>
      <br />
      <PanelHeader>1. What information do we collect?</PanelHeader>
      <br />
      <SectionHeader>Information you provide us:</SectionHeader>
      <Body>{` We collect the information you provided to us when you registered with us and created a profile. The types of personal information we may collect include:`}</Body>

      <ul className="list-inside list-disc text-light-100">
        <li>Name</li>
        <li>Email address</li>
        <li>Country</li>
        <li>Username</li>
      </ul>
      <br />
      <SectionHeader>Optional information for creating an account and managing registered users:</SectionHeader>
      <Body>
        {`We also collect any optional
        information you provide to us to complete your profile, such as your country, FIDE or USCF Titles, user bio, lichess or chess.com usernames, etc. This data
        processing is based on your consent, in accordance with Article 6.1.a of the GDPR. This data is kept until you
        withdraw your consent, then for the applicable limitation period for the purposes of managing disputes.`}
      </Body>

      <br />

      <SectionHeader>Social Login Data:</SectionHeader>
      <Body>
        {`If you login and create your account through a social media service (like Google or Facebook), we'll receive information from that service (e.g., your username and basic profile information) via the authorization procedures for that service.`}
      </Body>
      <br />

      <PanelHeader>2. How and why we use this informtaion?</PanelHeader>
      <SectionHeader>User Submitted Informtaion</SectionHeader>
      <Body>We use the user-submitted information we collect for various purposes, including:</Body>
      <ul className="list-inside list-disc text-light-100">
        <li>To provide, maintain, and improve our Services</li>
        <li>
          To manage your account and provide you with customer support; Your email address will remain confidential and
          is used to log in or in case you forget your password
        </li>
        <li>To personalize and improve your experience on our website</li>
        <li>To enforce our terms, conditions, and policies</li>
        <li>To comply with legal obligations</li>
        <li>To carry out any other purpose for which the information was collected</li>
      </ul>
      <br />
      <SectionHeader>Technical Information</SectionHeader>
      <Body>We use the technical information we collect for various purposes, including:</Body>
      <ul className="list-inside list-disc text-light-100">
        <li>To monitor and analyze trends, usage, and activities in connection with our Services</li>
        <li>To protect our services from attacks and malicious access to the site</li>
      </ul>
      <br />
      <PanelHeader>3. Cookies</PanelHeader>
      <SectionHeader>Session Cookies:</SectionHeader>
      <Body>
        {`Next-Chess also uses session cookies. These cookies temporarily store the
        information you have given us and thus allow us to track your movements from one page to another without asking
        you again for this information to authenticate you. This data processing is based on Next-Chess's legitimate
        interest in improving the browsing experience on its site, in accordance with Article 6.1.f of the GDPR. These
        data are kept for the duration of the browsing session. You can configure these cookies from your browser
        settings.`}
      </Body>
      <br />
      <PanelHeader className="mb-2">4. Sharing of Information</PanelHeader>
      <Body>{`We do not share your personal information with third parties except as described in this Privacy Policy. We may share information with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include payment processing, data analysis, email delivery, hosting services, and customer service.`}</Body>
      <Body>{`We may also share your information if we are legally required to do so or if we believe it is necessary to comply with a legal process, government request, or applicable law, regulation, or governmental request.`}</Body>
      <br />

      <PanelHeader>5. Data Security</PanelHeader>
      <Body>{`We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.`}</Body>
      <br />

      <PanelHeader>6. Managing Your Data</PanelHeader>
      <SectionHeader>Account Information</SectionHeader>
      <Body>{`You can access, update, or delete your personal information by logging into your account and going to your profile settings.`}</Body>
      <br />
      <SectionHeader>Account Deletion</SectionHeader>
      <Body>{`You can delete your account at any time through the account settings page. When you delete your account, we delete your personal information, including your email address, username, and profile information.`}</Body>
      <br />
      <SectionHeader>Retention</SectionHeader>
      <Body>{`We retain your personal information for as long as necessary to provide the Services you have requested, or for other essential purposes such as complying with our legal obligations, resolving disputes, and enforcing our policies.`}</Body>
      <br />
      <SectionHeader>Other Requests</SectionHeader>
      <Body>
        {`If you have any other requests or questions about your data, please contact us at `}{" "}
        <a href="mailto:support@next-chess.dev" className="underline hover:text-gold-200">
          support@next-chess.dev
        </a>
      </Body>
      <br />
      <PanelHeader>7. Changes to this Privacy Policy</PanelHeader>
      <Body>
        {`We may update this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).`}
      </Body>
    </div>
  );
};

export default Privacy;
