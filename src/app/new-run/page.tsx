import type { Metadata } from "next";
import { NewRunBuilder } from "@/components/new-run-builder";

export const metadata: Metadata = { title: "New run request" };
export default function NewRunPage() { return <div className="page-container wide-page"><div className="page-heading-row"><div><p className="eyebrow">Research intake</p><h1>New run request</h1><p className="page-lede">Frame the scientific question, decision boundaries, and success criteria before launching work in the Scientific Core runtime.</p></div></div><NewRunBuilder /></div>; }
