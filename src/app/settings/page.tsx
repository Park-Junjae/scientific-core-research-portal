import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";

export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() { return <div className="page-container narrow-page"><div className="page-heading-row"><div><p className="eyebrow">Local preferences</p><h1>Settings</h1><p className="page-lede">Choose how this static research workspace appears on this device.</p></div></div><SettingsForm /></div>; }
