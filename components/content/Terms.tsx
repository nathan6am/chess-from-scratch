import React from "react";
import { PanelHeader, SectionHeader, Anchor, Body } from "../base/Typography";
import Logo from "../base/Logo";
const Terms: React.FC = () => {
  return (
    <div className="p-4">
      <Logo size="lg" />
      <br />
      <PanelHeader className="text-3xl">Terms and Conditions</PanelHeader>
    </div>
  );
};

export default Terms;
