import type { Metadata } from "next";
import { NewRunBuilder } from "@/components/new-run-builder";
import { NewRunIntro } from "@/components/new-run-intro";

export const metadata: Metadata = { title: "New run request" };
export default function NewRunPage() { return <div className="page-container wide-page"><NewRunIntro /><NewRunBuilder /></div>; }
