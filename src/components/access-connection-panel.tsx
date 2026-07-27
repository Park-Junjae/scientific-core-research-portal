"use client";

import { CheckCircle2, ExternalLink, LoaderCircle, LogIn, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/locale";
import {
  getRunControlSession,
  runControlApiBase,
  RunControlApiError,
  type RunControlSession,
} from "@/lib/run-control-api";

function connectionFailureMessage(error: unknown, ko: boolean) {
  if (!(error instanceof RunControlApiError)) {
    return ko ? "연결 상태를 확인할 수 없습니다." : "Unable to check the connection.";
  }
  switch (error.kind) {
    case "ACCESS_CHALLENGE":
      return ko
        ? "Cloudflare Access 로그인이 필요합니다. 새 탭에서 랩 계정을 연결한 뒤 다시 확인하세요."
        : "Cloudflare Access sign-in is required. Connect the lab account in the new tab, then check again.";
    case "NETWORK":
      return ko
        ? "브라우저가 API에 연결하지 못했습니다. 네트워크 또는 CORS 상태를 확인하세요."
        : "The browser could not reach the API. Check the network or CORS state.";
    case "BACKEND_UNAUTHENTICATED":
      return ko
        ? "Cloudflare 세션이 Backend에서 인증되지 않았습니다. 랩 계정을 다시 연결하세요."
        : "The Cloudflare session was not authenticated by the Backend. Reconnect the lab account.";
    case "NOT_ALLOWLISTED":
      return ko
        ? "이 계정은 허용된 랩 계정 목록에 없습니다."
        : "This account is not on the lab allowlist.";
    case "FORBIDDEN":
      return ko
        ? "Backend가 이 요청을 허용하지 않았습니다."
        : "The Backend did not allow this request.";
    case "RATE_LIMITED":
      return ko
        ? "요청 한도에 도달했습니다. 잠시 기다린 뒤 다시 확인하세요."
        : "The request limit was reached. Wait before checking again.";
    case "UNAVAILABLE":
      return ko
        ? "Run Control Backend를 현재 사용할 수 없습니다."
        : "The Run Control Backend is currently unavailable.";
    case "INVALID_RESPONSE":
      return ko
        ? "API가 예상한 JSON이 아닌 응답을 반환했습니다."
        : "The API returned an invalid non-JSON response.";
    case "NOT_CONFIGURED":
      return ko
        ? "운영 API 주소가 빌드에 설정되지 않았습니다."
        : "The production API address is not configured in this build.";
    default:
      return error.message;
  }
}

export function AccessConnectionPanel({
  onConnected,
  compact = false,
}: {
  onConnected: (session: RunControlSession) => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [checking, setChecking] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function checkConnection() {
    setChecking(true);
    setFailed(false);
    setMessage("");
    try {
      const session = await getRunControlSession();
      setConnectedEmail(session.email);
      setMessage(ko ? "랩 계정 연결을 확인했습니다." : "Lab account connection confirmed.");
      onConnected(session);
    } catch (error) {
      setConnectedEmail("");
      setFailed(true);
      setMessage(connectionFailureMessage(error, ko));
    } finally {
      setChecking(false);
    }
  }

  return (
    <section
      className={`access-connection${compact ? " compact" : ""}`}
      aria-label={ko ? "랩 계정 연결" : "Lab account connection"}
    >
      <div className="access-connection-copy">
        <LogIn size={20} aria-hidden="true" />
        <div>
          <h2>{ko ? "랩 계정 연결" : "Connect a lab account"}</h2>
          <p>
            {ko
              ? "비공개 연구를 불러오기 전에 Cloudflare Access 세션을 연결하고 확인하세요."
              : "Connect and verify a Cloudflare Access session before loading private research."}
          </p>
        </div>
      </div>
      <div className="access-connection-actions">
        <a
          className="secondary-button"
          href={`${runControlApiBase}/api/session`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} />
          {ko ? "랩 계정으로 연결" : "Connect lab account"}
        </a>
        <button
          className="primary-button"
          type="button"
          disabled={checking}
          onClick={checkConnection}
        >
          {checking
            ? <LoaderCircle className="spin" size={16} />
            : connectedEmail
              ? <CheckCircle2 size={16} />
              : <RefreshCw size={16} />}
          {ko ? "연결 확인" : "Check connection"}
        </button>
      </div>
      {message && (
        <p
          className={failed ? "connection-message error" : "connection-message success"}
          role={failed ? "alert" : "status"}
        >
          {message}
          {connectedEmail ? ` · ${connectedEmail}` : ""}
        </p>
      )}
    </section>
  );
}
