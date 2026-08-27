# Case Study Style Guide

MAPWA is the reference layout for portfolio case studies. Shared values live in
`case-study-tokens.css`; project pages should import that file before their
page-specific styles.

## Typography

- H1: Georgia, 50px, weight 400, line-height 1.05
- H2/H3: Georgia, 40px, weight 400, line-height 1.1
- Intro/body: Satoshi, 18px, weight 400
- Labels/captions: Satoshi, 14px, weight 600
- Accent emphasis: Georgia italic using the project's theme color
- Mobile H1: 40px; mobile H2/H3: 34px

## Layout

- Maximum page width: 1380px
- Horizontal gutter: `clamp(24px, 4vw, 52px)`
- Main section padding: 36px top and bottom
- Section label-to-content gap: 34px
- Repeated chapter gap: 64px
- Repeated chapter top padding: 56px
- Media/copy gap: 42px
- Media radius: 12px

## Usage

```html
<link rel="stylesheet" href="case-study-tokens.css">
```

Map project-specific variables to the shared baseline:

```css
:root {
  --accent: #AD5954;
  --serif: var(--case-font-display);
  --sans: var(--case-font-body);
  --type-hero-title: var(--case-size-h1);
  --type-section-title: var(--case-size-h2);
  --type-body: var(--case-size-body);
}
```

Keep project identity in imagery and the accent color. Keep typography,
content width, spacing rhythm, responsive breakpoints, and media treatment
consistent with MAPWA unless the content requires a documented exception.
