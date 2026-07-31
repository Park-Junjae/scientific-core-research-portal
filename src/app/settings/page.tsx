import type { Metadata } from "next";
import { SettingsForm, SettingsHeading } from "@/components/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="page-container narrow-page">
      <SettingsHeading />
      <SettingsForm />
    </div>
  );
}
