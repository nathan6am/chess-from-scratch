import React from "react";
import { PanelHeader } from "../base/Typography";
const Privacy: React.FC = () => {
  return (
    <div className="p-4">
      <PanelHeader className="text-3xl">Privacy Policy</PanelHeader>
      <br />
      <p>
        {`This is the privacy policy for next-chess.dev, and online chess site. Please read it carefully to understand how
        we collect, use, and protect your personal information.`}
      </p>
      <br />
      <p>
        <strong>Questions or concerns?&nbsp;</strong>
        {`Reading this privacy notice will help you understand your privacy
        rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you
        still have any questions or concerns, please contact us at`}
        <a href="mailto:support@next-chess.dev" className="underline hover:text-gold-200">
          support@next-chess.dev
        </a>
        .
      </p>
      <br />
      <PanelHeader>1. What information do we collect and for what resaons?</PanelHeader>
      <br />
      <p>
        <strong>Account creation and management of registered users:</strong>{" "}
        {`Information needed to create an account
        and manage registered users: we collect the information you provided to us when you registered, such as your
        last name, email address and username.`}
      </p>
      <p>
        {`Optional information for creating an account and managing registered users: we also collect any optional
        information you provide to us to complete your profile, such as your country, FIDE or USCF Titles. This data
        processing is based on your consent, in accordance with Article 6.1.a of the GDPR. This data is kept until you
        withdraw your consent, then for the applicable limitation period for the purposes of managing disputes described
        in point 7. below.`}
      </p>
      <br />
      <p>
        <strong>Session cookies:</strong>{" "}
        {`Next-Chess also uses session cookies. These cookies temporarily store the
        information you have given us and thus allow us to track your movements from one page to another without asking
        you again for this information to authenticate you. This data processing is based on Next-Chess's legitimate
        interest in improving the browsing experience on its site, in accordance with Article 6.1.f of the GDPR. These
        data are kept for the duration of the browsing session. You can configure these cookies from your browser
        settings.`}
      </p>
      <br />
      <p>
        <strong>Social Media Login Data: </strong>
        {`We may provide you with the option to register with us using your
        existing social media account details, like your Facebook, Twitter, or other social media account. If you choose
        to register in this way, we will collect the information described in point 8. below`}
      </p>
      <br />

      <PanelHeader></PanelHeader>
    </div>
  );
};

export default Privacy;
