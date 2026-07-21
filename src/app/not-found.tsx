import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() { return <div className="not-found"><SearchX size={34} /><p className="eyebrow">404</p><h1>This research page is not available</h1><p>The run may not be published, or the link may be out of date.</p><Link className="primary-button" href="/runs/">Return to runs</Link></div>; }
