import { BookOpen, Database, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page-container narrow-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">연구 워크스페이스 소개</p>
          <h1>AI Cho-Scientist</h1>
          <p className="page-lede">
            문헌, 아이디어, 기전 분석과 연구 보고서를 하나의 읽기 흐름으로 연결합니다.
          </p>
        </div>
      </div>
      <div className="about-sections">
        <section>
          <BookOpen size={22} />
          <div>
            <h2>연구 결과를 먼저</h2>
            <p>연구 질문, 검토된 아이디어, 핵심 판단과 보고서를 중심으로 보여줍니다.</p>
          </div>
        </section>
        <section>
          <ShieldCheck size={22} />
          <div>
            <h2>명시적인 공개 경계</h2>
            <p>허용되고 비식별화된 자료만 공개 번들에 포함됩니다.</p>
          </div>
        </section>
        <section>
          <Database size={22} />
          <div>
            <h2>정적 공개 사이트</h2>
            <p>공개가 승인된 읽기 자료는 연구 VM 상태와 무관하게 계속 열립니다.</p>
          </div>
        </section>
      </div>
      <p className="demo-disclosure">
        <strong>현재 콘텐츠:</strong> 합성 데모만 포함하며 비공개 연구 결과는 포함하지 않습니다.
      </p>
    </div>
  );
}
