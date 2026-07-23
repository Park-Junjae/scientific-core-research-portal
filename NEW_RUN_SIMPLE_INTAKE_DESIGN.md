# New Run Simple Intake Design

## Default surface

The default New Run page asks for one required natural-language research request. A second textarea accepts optional references, prior results, constraints, and exclusions. One primary action downloads a `RunRequestV2` request file. No scientific execution occurs in the static portal.

The compiled preview is absent before input. After input it shows readable sections, default outputs, and the confirmation boundary without raw JSON, Markdown, or internal enum values.

## Advanced settings

A collapsed `고급 설정` / `Advanced settings` disclosure retains title, run type, research question and goal, bottleneck, experimental constraints, success and failure criteria, non-goals, custom outputs, output language, visibility, notes, and legacy structured-request import.

Only `raw_research_request` is required in simple mode. The default output bundle always includes a scientific summary, complete literature list and scope, ideas or competing decisions, comparison and evaluation, Knowledge Background, and final PDF report.

## Responsive behavior

The form uses a maximum 820 px reading width before content exists. A preview may occupy a second desktop column after content exists. Mobile remains one column, places the primary action immediately after the required request, keeps advanced settings below, and avoids horizontal overflow.

## Visual evidence

- `UPDATED_SCREENSHOTS/new-run-ko-desktop-empty-1440x900.png`
- `UPDATED_SCREENSHOTS/new-run-en-desktop-filled-1440x900.png`
- `UPDATED_SCREENSHOTS/new-run-ko-mobile-filled-390x844.png`
- `UPDATED_SCREENSHOTS/new-run-en-mobile-empty-390x844.png`
