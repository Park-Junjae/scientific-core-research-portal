"use client";

import { CheckCircle2, LoaderCircle, LogIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
        ? "Google로 계속하여 Cloudflare Access 로그인을 완료하세요."
        : "Continue with Google to complete Cloudflare Access sign-in.";
    case "NETWORK":
      return ko
        ? "브라우저가 API에 연결하지 못했습니다. 네트워크 또는 CORS 상태를 확인하세요."
        : "The browser could not reach the API. Check the network or CORS state.";
    case "BACKEND_UNAUTHENTICATED":
      return ko
        ? "Cloudflare 세션이 Backend에서 인증되지 않았습니다."
        : "The Cloudflare session was not authenticated by the Backend.";
    case "NOT_ALLOWLISTED":
      return ko
        ? "이 계정은 허용된 계정 목록에 없습니다."
        : "This account is not on the allowlist.";
    case "FORBIDDEN":
      return ko
        ? "Backend가 이 요청을 허용하지 않았습니다."
        : "The Backend did not allow this request.";
    case "RATE_LIMITED":
      return ko
        ? "요청 한도에 도달했습니다. 잠시 기다린 뒤 다시 확인하세요."
        : "The request limit was reached. Wait before trying again.";
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
  onSessionChange,
  compact = false,
}: {
  onSessionChange: (session: RunControlSession | null) => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const ko = locale === "ko";
  const [checking, setChecking] = useState(true);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    setFailed(false);
    setMessage("");
    try {
      const session = await getRunControlSession();
      setConnectedEmail(session.email);
      onSessionChange(session);
    } catch (error) {
      setConnectedEmail("");
      setFailed(true);
      setMessage(connectionFailureMessage(error, ko));
      onSessionChange(null);
    } finally {
      setChecking(false);
    }
  }, [ko, onSessionChange]);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => { void checkConnection(); }, 0);
    const recheckOnFocus = () => { void checkConnection(); };
    const recheckWhenVisible = () => {
      if (document.visibilityState === "visible") void checkConnection();
    };
    window.addEventListener("focus", recheckOnFocus);
    document.addEventListener("visibilitychange", recheckWhenVisible);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("focus", recheckOnFocus);
      document.removeEventListener("visibilitychange", recheckWhenVisible);
    };
  }, [checkConnection]);

  return (
    <section
      className={`access-connection${compact ? " compact" : ""}`}
      aria-label="Account connection"
    >
      {connectedEmail ? (
        <p className="connected-email" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{connectedEmail}</span>
          {checking && <LoaderCircle className="spin" size={15} aria-label="Checking session" />}
        </p>
      ) : checking ? (
        <p className="connection-checking" role="status">
          <LoaderCircle className="spin" size={16} aria-hidden="true" />
          {ko ? "계정 확인 중" : "Checking account"}
        </p>
      ) : (
        <button
          className="primary-button continue-with-google"
          type="button"
          onClick={() => {
            window.open(
              `${runControlApiBase}/api/session`,
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          <LogIn size={16} aria-hidden="true" />
          Continue with Google
        </button>
      )}
      {failed && message && (
        <p className="connection-message error" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
