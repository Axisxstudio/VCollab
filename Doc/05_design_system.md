# VCollab – Design System & UI Direction

---

## Brand Direction

**Personality:** Collaborative, intelligent, modern, student-friendly
**Style Keywords:** Clean, Premium, Trustworthy, Tech-forward, Community-driven
**Tone:** Professional but approachable. Not corporate. Not childish.
**Visual Inspiration:** Linear.app + Notion + Product Hunt (for cards) + Vercel (for clean layout)

**Font Strategy:** Import from Google Fonts
- Headlines: **Sora** (modern, geometric, confident)
- Body: **Inter** (neutral, highly readable, professional)
- Code/TechStack: **JetBrains Mono**

---

## Color System (CSS Custom Properties)

```css
:root {
  /* Primary Brand */
  --color-primary:       #6C63FF;   /* Purple-Indigo - brand identity */
  --color-primary-hover: #5A52E0;
  --color-primary-light: #EDE9FF;
  --color-primary-dark:  #4B44C8;

  /* Secondary */
  --color-secondary:     #06B6D4;   /* Cyan - accent for tags, badges */
  --color-secondary-light: #CFFAFE;

  /* Accent (CTA pop) */
  --color-accent:        #F59E0B;   /* Amber - highlights, stars */

  /* Semantic */
  --color-success:       #10B981;
  --color-success-light: #D1FAE5;
  --color-warning:       #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-error:         #EF4444;
  --color-error-light:   #FEE2E2;

  /* Neutral / Background */
  --color-bg:            #F9FAFB;   /* Page background */
  --color-surface:       #FFFFFF;   /* Cards, panels */
  --color-surface-hover: #F3F4F6;
  --color-border:        #E5E7EB;
  --color-border-focus:  #6C63FF;

  /* Text */
  --color-text-primary:  #111827;
  --color-text-secondary:#4B5563;
  --color-text-muted:    #9CA3AF;
  --color-text-inverse:  #FFFFFF;

  /* Admin-specific surface */
  --color-admin-bg:      #F1F0FF;
  --color-admin-sidebar: #1E1B4B;
}
```

### Dark Mode Tokens (optional future)
```css
[data-theme="dark"] {
  --color-bg:       #0F0E17;
  --color-surface:  #1A1928;
  --color-border:   #2D2B55;
  --color-text-primary: #F9FAFB;
  --color-text-secondary: #D1D5DB;
}
```

---

## Typography Scale

```css
/* Sora for headings */
.text-hero    { font: 700 3.5rem/1.1 'Sora', sans-serif; letter-spacing: -0.02em; }
.text-h1      { font: 700 2.5rem/1.2 'Sora', sans-serif; }
.text-h2      { font: 600 2rem/1.3 'Sora', sans-serif; }
.text-h3      { font: 600 1.5rem/1.4 'Sora', sans-serif; }
.text-h4      { font: 600 1.25rem/1.4 'Sora', sans-serif; }

/* Inter for body */
.text-body-lg { font: 400 1.125rem/1.75 'Inter', sans-serif; }
.text-body    { font: 400 1rem/1.625 'Inter', sans-serif; }
.text-body-sm { font: 400 0.875rem/1.5 'Inter', sans-serif; }
.text-meta    { font: 400 0.75rem/1.4 'Inter', sans-serif; color: var(--color-text-muted); }
.text-label   { font: 500 0.875rem/1 'Inter', sans-serif; }
.text-btn     { font: 600 0.875rem/1 'Inter', sans-serif; letter-spacing: 0.01em; }
.text-helper  { font: 400 0.75rem/1.4 'Inter', sans-serif; color: var(--color-text-muted); }
.text-code    { font: 400 0.875rem/1.6 'JetBrains Mono', monospace; }
```

---

## Spacing & Layout System

```css
/* 4px base unit */
--space-1:  4px;     /* micro gaps */
--space-2:  8px;     /* icon padding */
--space-3:  12px;    /* tight gaps */
--space-4:  16px;    /* default gap */
--space-5:  20px;
--space-6:  24px;    /* card padding */
--space-8:  32px;    /* section gap */
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;    /* section spacing */
--space-20: 80px;    /* hero padding */
--space-24: 96px;

/* Border Radius */
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  24px;
--radius-full: 9999px;

/* Shadows */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 2px 8px rgba(108,99,255,0.08);
--shadow-md: 0 4px 16px rgba(108,99,255,0.12);
--shadow-lg: 0 8px 32px rgba(108,99,255,0.16);
--shadow-xl: 0 16px 48px rgba(108,99,255,0.20);

/* Max container widths */
--container-sm:   640px;
--container-md:   768px;
--container-lg:   1024px;
--container-xl:   1280px;
--container-2xl:  1440px;
```

---

## Component System

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--color-primary);
  color: white; border-radius: var(--radius-md);
  padding: 10px 20px; font: var(--text-btn);
  transition: all 0.2s; box-shadow: var(--shadow-sm);
}
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }

/* Secondary */
.btn-secondary { background: var(--color-secondary); color: white; }

/* Outline */
.btn-outline { border: 1.5px solid var(--color-primary); color: var(--color-primary); background: transparent; }

/* Ghost */
.btn-ghost { background: transparent; color: var(--color-text-secondary); }
.btn-ghost:hover { background: var(--color-surface-hover); }

/* Danger */
.btn-danger { background: var(--color-error); color: white; }

/* Sizes */
.btn-sm { padding: 6px 14px; font-size: 0.8125rem; }
.btn-lg { padding: 14px 28px; font-size: 1rem; border-radius: var(--radius-lg); }
.btn-icon { padding: 8px; border-radius: var(--radius-md); }
```

---

### Cards

**Project Card:**
```
┌────────────────────────────────────────┐
│  [Thumbnail - 16:9 image]              │
│  [Category badge] [Visibility badge]   │
│  Project Title (h4)                    │
│  Short description (text-body-sm, 2ln) │
│  [Tech stack chips]                    │
│  ─────────────────────────────────────  │
│  [Avatar] Username      [Like] [Save]  │
└────────────────────────────────────────┘
```
- `border-radius: var(--radius-xl)`
- `box-shadow: var(--shadow-sm)`
- hover: `transform: translateY(-3px); box-shadow: var(--shadow-md)`

**Post Card:**
```
┌────────────────────────────────────────┐
│  [Avatar] [Username] · [timestamp]     │
│  Post content (max 3 lines)            │
│  [Image if applicable]                 │
│  ─────────────────────────────────────  │
│  👍 12  💬 3  🔖 Save  ↗ Share  ⚑      │
└────────────────────────────────────────┘
```

**Blog Card:**
```
┌────────────────────────────────────────┐
│  [Cover Image]                         │
│  [Category tag]  [Read Time]           │
│  Blog Title (h4)                       │
│  Short excerpt (2 lines)               │
│  ─────────────────────────────────────  │
│  [Avatar] Author Name · [Date]         │
└────────────────────────────────────────┘
```

**User/Contributor Card:**
```
┌─────────────────────────┐
│   [Profile image]       │
│   Full Name             │
│   @username             │
│   Bio (1 line)          │
│   N projects            │
│   [Follow Button]       │
└─────────────────────────┘
```

---

### Content Interaction Bar
```
[ 👍 Like (42) ] [ 💬 Comment (8) ] [ 🔖 Save ] [ ↗ Share ] [ ⚑ Report ]
```
- Icons use Ant Design Icons or Lucide React
- Active like: filled icon in `--color-error` (heart) or `--color-primary` (thumb)
- Saved: filled bookmark in `--color-accent`
- Hover: `color: var(--color-primary)` transition

---

### Interaction Bar Icons (Recommended)

| Action           | Icon (Lucide/AntD)      | Active State         |
|------------------|-------------------------|----------------------|
| Like             | `HeartIcon`             | Filled, red          |
| Comment          | `MessageCircleIcon`     | Outlined always      |
| Save/Bookmark    | `BookmarkIcon`          | Filled, amber        |
| Share            | `Share2Icon`            | No active state      |
| Report           | `FlagIcon`              | Filled, error red    |
| GitHub           | `GithubIcon`            | Always shown if URL  |
| Follow           | `UserPlusIcon`          | Becomes UserCheckIcon|
| Message          | `MessageSquareIcon`     | -                    |
| Notification     | `BellIcon`              | Pulse on new notif   |
| Warning          | `AlertTriangleIcon`     | Amber                |
| Export PDF       | `FileTextIcon`          | -                    |
| Restore          | `RotateCcwIcon`         | -                    |
| Delete           | `Trash2Icon`            | Danger red on hover  |
| Visibility: Public| `GlobeIcon`            | -                    |
| Visibility: Private| `LockIcon`            | -                    |
| Active           | `ToggleRightIcon`       | Green                |
| Inactive         | `ToggleLeftIcon`        | Gray                 |
| Category         | `LayoutGridIcon`        | -                    |
| Upload Image     | `ImageIcon`             | -                    |
| Upload Video     | `VideoIcon`             | -                    |

---

### Category Select UX
```
┌──────────────────────────────────────┐
│ 🔍 Search or create category...       │
├──────────────────────────────────────┤
│ ✓ 2nd Year                           │
│   3rd Year                           │
│   Web Development                    │
│ + Create "Machine Learning"          │  ← inline create option
└──────────────────────────────────────┘
```

---

### Notification Dropdown
```
┌──────────────────────────────────────────┐
│ Notifications          [Mark all read]   │
├──────────────────────────────────────────┤
│ 🔵 [Avatar] @alice liked your project    │
│              2 mins ago                  │
├──────────────────────────────────────────┤
│    [Avatar] @bob commented on your post  │
│              1 hour ago                  │
├──────────────────────────────────────────┤
│            View all notifications        │
└──────────────────────────────────────────┘
```
- Unread item: blue dot + light `--color-primary-light` background
- Read item: white background

---

### Toggle Controls
```
Active:   [══●] GREEN  text: "Active"
Inactive: [●══] GRAY   text: "Inactive"

Public:   [🌐 Public ▾]   → click to change to Private
Private:  [🔒 Private ▾]  → click to change to Public
```
- Ant Design `Switch` component customized with tokens

---

### Admin Table
```
| # | User       | Role    | Status  | Created    | Actions     |
|---|------------|---------|---------|------------|-------------|
| 1 | @student1  | STUDENT | Active  | 2026-01-12 | Edit Suspend|
| 2 | @expert1   | EXPERT  | Active  | 2026-01-15 | Edit Suspend|
```
- Ant Design `Table` with custom row styling
- Filter bar above (search input + role dropdown + status dropdown)
- Export PDF button top-right

---

## Empty / Loading / Error States

**Empty State:**
```
      [illustration SVG]
  No projects found yet.
  Be the first to upload a project!
  [+ Create Project Button]
```

**Loading State:**
- Skeleton cards (Ant Design Skeleton) matching card dimensions
- Framer Motion fade-in when data arrives

**Error State:**
```
      [⚠️ icon]
  Something went wrong.
  Please try again.
  [Retry Button]
```

---

## Responsive Breakpoints

```css
--bp-sm:  640px;   /* mobile landscape */
--bp-md:  768px;   /* tablet */
--bp-lg:  1024px;  /* small desktop */
--bp-xl:  1280px;  /* large desktop */
--bp-2xl: 1536px;  /* wide screen */
```

### Layout Behavior
| Viewport | Card Grid         | Navbar              | Sidebar         |
|----------|-------------------|---------------------|-----------------|
| Mobile   | 1 column          | Hamburger menu      | Collapsed drawer|
| Tablet   | 2 columns         | Partial nav         | Collapsed       |
| Desktop  | 3 columns         | Full navbar         | Persistent      |

---

## Ant Design Theme Token Overrides (antd-theme.js)

```js
export const antdTheme = {
  token: {
    colorPrimary: '#6C63FF',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorBorder: '#E5E7EB',
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F9FAFB',
    boxShadow: '0 4px 16px rgba(108,99,255,0.12)',
  }
};
```

---

## Logo Concept Direction

**Mark:** Stylized "V" or interlocking "VC" monogram suggesting collaboration
**Shape:** Two overlapping V-shapes or a node-connection graphic inside a rounded square
**Color:** Gradient from `#6C63FF` to `#06B6D4` (purple to cyan)
**Wordmark:** "VCollab" in Sora Bold, "by VTech AI Solutions" in Inter Regular below at 60% opacity
**Variants:** Full horizontal lockup, icon-only for favicon, reversed for dark backgrounds

**Tagline direction:**
> *"Build Together. Learn Together."*
> or
> *"Where Ideas Become Projects."*
