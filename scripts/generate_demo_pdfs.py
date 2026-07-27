"""Historical fixture generator only.

This script is not part of the portal build or publication path. Reader-facing
reports must come from explicit ResearchReportManifestV2 records; a missing
report remains summary-only instead of receiving a generated placeholder PDF.
"""

from __future__ import annotations

from pathlib import Path
import shutil

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]


def fonts() -> tuple[str, str]:
    regular = Path("C:/Windows/Fonts/malgun.ttf")
    bold = Path("C:/Windows/Fonts/malgunbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("PortalSans", str(regular)))
        pdfmetrics.registerFont(TTFont("PortalSansBold", str(bold)))
        return "PortalSans", "PortalSansBold"
    return "Helvetica", "Helvetica-Bold"


def build_pdf(target: Path, title: str, subtitle: str, sections: list[tuple[str, str]]) -> None:
    regular, bold = fonts()
    target.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontName=bold, fontSize=25, leading=31, textColor=HexColor("#14201d"), spaceAfter=12 * mm, alignment=TA_LEFT)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName=regular, fontSize=10, leading=15, textColor=HexColor("#66726e"), spaceAfter=16 * mm)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontName=bold, fontSize=15, leading=20, textColor=HexColor("#0b6b50"), spaceBefore=7 * mm, spaceAfter=3 * mm)
    body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontName=regular, fontSize=10.5, leading=17, textColor=HexColor("#34423e"), spaceAfter=5 * mm)
    doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=24 * mm, leftMargin=24 * mm, topMargin=24 * mm, bottomMargin=22 * mm, title=title, author="AI Cho-Scientist synthetic demo")
    story = [Paragraph("AI CHO-SCIENTIST · SYNTHETIC DEMONSTRATION", subtitle_style), Paragraph(title, title_style), Paragraph(subtitle, subtitle_style)]
    for heading, body in sections:
        story.extend([Paragraph(heading, heading_style), Paragraph(body, body_style)])
    story.extend([Spacer(1, 10 * mm), Paragraph("This PDF contains synthetic public-safe demonstration content. It is not scientific evidence and is not copied from a private run.", subtitle_style)])
    doc.build(story)


def main() -> None:
    jobs = [
        ("xrrna-prime-assembly-demo/idea-report-en.pdf", "Symmetric structured-RNA motif panel", "The primary focused-decision report with explicit evidence boundaries.", [("Question", "Can paired structured RNA elements selectively preserve a productive assembly state rather than merely increase mature RNA abundance?"), ("Mechanism", "The panel tests whether symmetric protection changes the residence-time distribution of intact RNA near the productive complex."), ("Decisive test", "Separate bulk abundance, assembly-proximal state, intended product, byproducts, and burden in matched conditions."), ("Kill criterion", "Stop if product follows mature abundance alone or if product quality worsens at matched activity.")]),
        ("xrrna-prime-assembly-demo/idea-report-ko.pdf", "조립 상태 선택적 보호", "근거의 경계와 중단 기준을 분명히 한 읽기용 기전 보고서입니다.", [("질문", "구조화 RNA 요소가 성숙 RNA 총량만 늘리는 것이 아니라 생산적 조립 상태를 선택적으로 보호하는가?"), ("기전", "생산적 복합체 주변에서 온전한 RNA가 머무는 시간 분포가 달라진다는 가설입니다."), ("결정적 실험", "전체 RNA, 조립 근접 상태, 목표 산물, 부산물과 부담을 같은 실험에서 구분합니다."), ("중단 기준", "산물이 성숙 RNA 양만 따라가거나 산물 품질이 악화되면 중단합니다.")]),
        ("xrrna-prime-assembly-demo/measurement-report-en.pdf", "Molecular-identity readout", "Measurement must precede causal attribution.", [("Purpose", "Resolve target linkage, template provenance, sequence, length class, and recovery bias on the same molecule."), ("Decision", "Park causal attribution when the required molecular identity is not identifiable.")]),
        ("xrrna-prime-assembly-demo/measurement-report-ko.pdf", "분자 정체성 판독", "인과 해석보다 측정 가능성 확인이 먼저입니다.", [("목적", "같은 분자에서 표적 연결, 주형 유래, 서열, 길이 계층과 회수 편향을 판별합니다."), ("판정", "필요한 분자 정체성을 확인할 수 없으면 인과 해석을 보류합니다.")]),
        ("prame-logic-first-demo/logic-first-report-en.pdf", "PRAME logic-first transfer", "A context gate before experimental recommendation.", [("Transfer rule", "Proceed only when the receiving context contains and exposes the state required by the mechanism."), ("Boundary", "Source-system precedent remains analogical until the relevant context and readout match."), ("Decision", "Refine before testing.")]),
        ("prame-logic-first-demo/logic-first-report-ko.pdf", "PRAME 로직 우선 전이", "실험 권고 전에 표적 맥락을 확인합니다.", [("전이 규칙", "수용 맥락에 기전에 필요한 상태가 존재하고 측정될 때만 진행합니다."), ("경계", "관련 맥락과 판독이 일치하기 전까지 원래 시스템의 선례는 유추 수준입니다."), ("판정", "실험 전 보완이 필요합니다.")]),
        ("prame-logic-first-demo/verifier-report-en.pdf", "Verifier-first contrast", "Controls that separate target-state dependence from broad burden.", [("Required contrasts", "Use state-positive, state-negative, inactive-intervention, and burden-matched controls."), ("Stop rule", "Do not proceed when the intended route cannot be distinguished from broad burden.")]),
        ("prame-logic-first-demo/verifier-report-ko.pdf", "검증기 우선 대조", "표적 상태 의존성과 광범위 부담을 분리하는 대조 설계입니다.", [("필수 대조", "상태 양성·음성, 비활성 개입, 부담 일치 대조를 사용합니다."), ("중단 규칙", "의도한 경로와 광범위 부담을 구분하지 못하면 진행하지 않습니다.")]),
        ("taled-historical-demo/historical-case-en.pdf", "TALED historical quality case", "Mechanistic coordinates retained without an active recommendation.", [("Helical phase", "Rotational registry can be a distinct variable from linear spacer distance."), ("Evidence boundary", "Structural plausibility did not establish a complete mitochondrial TALED implementation."), ("Archive decision", "Retain as a learning case, not an active recommendation.")]),
        ("taled-historical-demo/historical-case-ko.pdf", "TALED 과거 품질 사례", "기전 좌표는 보관하지만 현재 권고로 제시하지 않습니다.", [("나선 위상", "회전 정렬은 선형 spacer 거리와 구분되는 변수가 될 수 있습니다."), ("근거 경계", "구조적 개연성은 미토콘드리아 TALED 전체 구현의 작동을 입증하지 않습니다."), ("보관 판정", "현재 권고가 아닌 학습 사례로 보관합니다.")]),
        ("taled-historical-demo/exposure-case-en.pdf", "Exposure-time distribution", "An archived kinetic interpretation of product purity.", [("Hypothesis", "Target-only and multi-edit molecules may require different exposure times."), ("Boundary", "No practical mitochondrial control mechanism was established."), ("Kill criterion", "Drop if time reduction changes all products proportionally or burden dominates.")]),
        ("taled-historical-demo/exposure-case-ko.pdf", "노출 시간 분포", "산물 순도에 대한 보관된 동역학 해석입니다.", [("가설", "표적 단일 편집과 다중 편집 산물은 서로 다른 노출 시간을 요구할 수 있습니다."), ("경계", "실용적인 미토콘드리아 제어 기전은 확립되지 않았습니다."), ("중단 기준", "시간 단축이 모든 산물을 비례적으로 바꾸거나 부담이 우세하면 중단합니다.")]),
    ]
    for relative, title, subtitle, sections in jobs:
        fixture_root = ROOT / "tests" / "fixtures" / "demo-content"
        public_pdf = fixture_root / "public" / "artifacts" / relative
        build_pdf(public_pdf, title, subtitle, sections)
        run_slug, filename = relative.split("/", 1)
        canonical_pdf = fixture_root / "runs" / run_slug / "reports" / filename
        canonical_pdf.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(public_pdf, canonical_pdf)
    print(f"Generated {len(jobs)} synthetic demonstration PDFs.")


if __name__ == "__main__":
    main()
