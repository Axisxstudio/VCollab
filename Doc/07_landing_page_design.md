# VCollab – Landing Page Design Plan

---

## Navbar (Fixed Top)

**Layout:** Full-width sticky navbar with transparent → solid on scroll
**Height:** 64px

**Left:**
- VCollab logo (icon + wordmark)

**Center (Desktop):**
- Explore Projects | Blog | About

**Right:**
- [Sign In] outlined button
- [Create Account] primary button

**Mobile:**
- Logo left
- Hamburger menu right → drawer with navigation links + auth buttons

**Microcopy on hover:** "Discover what students are building"

---

## Section 1 – Hero

**Visual Treatment:**
- Full-viewport-height section
- Background: subtle animated gradient mesh (`#6C63FF → #06B6D4`) at low opacity
- Large decorative code/UI illustration floating right (or abstract collaboration graphic)
- Centered on mobile, split on desktop

**Copy:**

```
Tag:     🎓 Campus-First Collaboration Platform

H1:      Where Students Connect
         and Build Projects Together

Body:    VCollab is the platform built for students who want to discover
         project ideas, collaborate with peers, and turn semester
         assignments into impressive real-world work.
         Join thousands of students already sharing and learning together.

CTA1:    [🚀 Create Free Account]   ← primary button (large)
CTA2:    [👁 Explore Projects]       ← outline button (large)
```

**Trust indicators below buttons:**
```
✓ Free to join  ·  ✓ No credit card  ·  ✓ Student-first community
```

**Visual Element:**
- Right/bottom: UI preview card stack (2–3 project cards floating with subtle shadow and animation)
- OR: Custom illustration showing 3 connected student avatars sharing a laptop/code screen

---

## Section 2 – Platform Stats Bar

**Purpose:** Build instant social proof
**Style:** Full-width dark purple strip between Hero and About

```
📁 500+ Projects Shared  ·  👥 2,000+ Students  ·  💬 1,500+ Collaborations  ·  🌐 20+ Institutions
```

*(Use placeholder values, can be made dynamic via admin CMS later)*

---

## Section 3 – Why VCollab Exists (About)

**Layout:** 2-column (text left, illustration right). Stack on mobile.

**Headline:**
```
You Have Ideas.
You Just Need the Right Platform.
```

**Body:**
```
Students across every year struggle with the same challenge:
project ideas feel overwhelming, finding teammates is hard,
and getting real guidance feels impossible.

VCollab was built to change that. It's a collaborative community
where you can share your work, discover inspiring projects from
other students, and connect with people who are building the same
kind of future you are.

This is where semester projects become portfolios.
Where questions turn into conversations.
Where ideas become real.
```

**Visual:** Two students collaborating over code/diagrams (custom illustration or high-quality stock)

---

## Section 4 – Key Benefits (Feature Cards)

**Headline:**
```
Everything a Student Builder Needs
```

**Layout:** 3-column card grid (→ 2 col tablet → 1 col mobile)

**Cards:**

| Icon | Title | Copy |
|------|-------|------|
| 🗂️ | Upload Your Projects | Share your academic work with the world. Build a real portfolio while you study. |
| 💡 | Discover Project Ideas | Explore hundreds of projects sorted by year, category, and tech stack. |
| 🤝 | Find Collaborators | Connect with students at your level or find mentors with more experience. |
| 📖 | Learn from Real Work | See how others solved the same problems you're facing. Real code, real projects. |
| 💬 | Start Conversations | Message peers directly. Comment, react, and discuss what you're building. |
| 🏆 | Build Your Profile | Your contributions grow your profile. Recruiters notice active contributors. |

**Card design:** White card, `--radius-xl`, icon in colored circle (brand colors), hover lift animation

---

## Section 5 – Featured Projects

**Headline:**
```
Projects Built by Students Like You
```

**Subheadline:**
```
Real academic work. Real implementations.
Browse what your peers are building this semester.
```

**Layout:** 3 project cards in a row (→ 1 col mobile)

**Each project card shows:**
- Thumbnail image (16:9)
- Category badge (e.g. "2nd Year")
- Project title
- Short description (2 lines)
- Author avatar + username (clickable but prompts login if not auth'd)
- Like count + Comment count

**CTA below cards:**
```
[View All Projects →]
```

**Login gate behavior:**
- Author click → "Sign in to view ${username}'s profile"
- View All → redirects to /login with returnUrl=/projects

---

## Section 6 – How VCollab Works

**Headline:**
```
Get Started in 4 Simple Steps
```

**Layout:** Horizontal stepper (→ vertical on mobile)

**Steps:**

```
  ①                  ②                  ③                  ④
[👤]              [✏️]              [📤]              [🤝]
Create Account   Build Profile    Upload Project   Connect & Grow
Sign up free     Add your skills,  Share your       Like, comment,
in 30 seconds.   bio, and links.   work publicly.   collaborate.
```

**Visual treatment:** Step circles with brand gradient, connected by a dashed horizontal line

---

## Section 7 – Latest Posts

**Headline:**
```
What the Community Is Sharing
```

**Layout:** 3 post feed cards in a row (→ 1 col mobile)

**Each post card shows:**
- Author avatar + name + timestamp
- Post content preview (3 lines)
- Image preview if applicable
- Interaction counts (blurred/disabled for public)

**CTA:**
```
"Sign in to join the conversation →"
```

---

## Section 8 – Blog Preview

**Headline:**
```
Learn From the Community
```

**Layout:** 3 blog cards in a row (→ 1 col mobile)

**Each blog card shows:**
- Cover image (3:2)
- Category tag
- Blog title (2 lines)
- Author name + publish date

**CTA:**
```
[Read Latest Articles →]
```

---

## Section 9 – Top Contributors

**Headline:**
```
Meet Active VCollab Contributors
```

**Subheadline:**
```
These students are sharing their work and helping others learn.
```

**Layout:** 6 contributor cards in 3-column grid (→ 2 col → 1 col)

**Each user card shows:**
- Profile image (circle, 72px)
- Full name
- @username
- Bio (1 line)
- N projects uploaded
- [Follow] button → prompts login if not authenticated

---

## Section 10 – Social Proof (Testimonials)

**Headline:**
```
Students Love VCollab
```

**Layout:** 3 testimonial cards side by side

**Each card:**
```
"VCollab helped me find my final year project idea in 10 minutes.
I also got two teammates from the platform."

— Arjun M., 3rd Year CS Student
⭐⭐⭐⭐⭐
```

*Note: Use realistic placeholder testimonials. These can be made dynamic by admin later.*

---

## Section 11 – Why Join VCollab (Value Proposition)

**Headline:**
```
Built for Students. Open to Everyone.
```

**Layout:** Two-column split

**Left – Student focus:**
```
For Students:
✓ Discover project ideas by year and category
✓ Upload your work and get feedback
✓ Build a portfolio that speaks for itself
✓ Connect with teammates who share your vision
✓ Learn from real implementations
```

**Right – Experts and Engineers:**
```
For Industrial Experts & Engineers:
✓ Share your knowledge through posts and blogs
✓ Mentor students with real-world experience
✓ Discover emerging talent
✓ Stay connected to the academic world
```

---

## Section 12 – Call to Action (Final)

**Style:** Full-width gradient section (`#6C63FF → #4B44C8`, light text)

**Copy:**
```
H2:    Start Collaborating Today

Body:  Join the VCollab community and take your academic projects
       to a level you never imagined possible.
       Your best project is still ahead of you.

CTA1:  [🚀 Create Free Account]
CTA2:  [Sign In]
```

**Visual:** Subtle grid or particle mesh background

---

## Section 13 – VTech AI Solutions Area

**Style:** Minimal, dark footer pre-section strip
**Purpose:** Brand association, expandable by admin

```
Powered by VTech AI Solutions

VTech AI Solutions builds intelligent platforms for the next generation
of students and professionals.

[Learn More ↗]                     ← links to VTech site (future)
```

*Note: This area should be CMS-configurable by admin in a future update.*

---

## Footer

**Layout:** 4-column footer (→ 2 col tablet → 1 col mobile)
**Background:** Dark (`#111827`)
**Text:** Light gray

**Column 1 – Brand:**
```
[VCollab Logo]
VCollab – by VTech AI Solutions
Build Together. Learn Together.
[Twitter] [LinkedIn] [GitHub] icons
```

**Column 2 – Platform:**
```
Explore Projects
Latest Posts
Blog
How It Works
```

**Column 3 – Account:**
```
Create Account
Sign In
Forgot Password
```

**Column 4 – Company:**
```
About VCollab
VTech AI Solutions
Contact Us
Privacy Policy
Terms of Use
```

**Bottom strip:**
```
© 2026 VCollab by VTech AI Solutions. All rights reserved.
```

---

## Microcopy Guide

| Trigger | Microcopy |
|---------|-----------|
| Author click (not logged in) | "Sign in to view this profile" |
| Like button hover (not logged in) | "Sign in to like this project" |
| Comment section (not logged in) | "Join the conversation – sign in to comment" |
| Empty projects page | "No projects yet. Be the first to share yours!" |
| Loading feed | "Finding the best projects for you..." |
| Follow button hover | "Follow to get updates from this creator" |
| Share button | "Link copied to clipboard! 🎉" |
| Save confirmation | "Saved to your collection!" |
| Form error | "Please fill in all required fields." |
| Registration success | "Welcome to VCollab! Let's set up your profile →" |

---

## Public Access Logic

| Feature | Public Visitors | Authenticated Users |
|---------|----------------|---------------------|
| View landing page | ✅ | ✅ |
| View limited content previews | ✅ (3 items per section) | ✅ |
| View full project detail | ❌ → Login prompt | ✅ |
| Like / Comment / Save | ❌ → Login prompt | ✅ |
| View author profile | ❌ → Login prompt | ✅ |
| Follow users | ❌ → Login prompt | ✅ |
| Access feed | ❌ → Login prompt | ✅ |

---

## Component Checklist for Landing Page

| Component | Description |
|-----------|-------------|
| `LandingNavbar` | Transparent → solid, auth buttons, mobile drawer |
| `HeroSection` | Gradient BG, headline, CTA buttons, visual |
| `StatsBanner` | Dark strip with community numbers |
| `AboutSection` | 2-col text + illustration |
| `BenefitCard` | Icon + title + description card |
| `ProjectCardPublic` | Thumbnail, category, author (gated), interactions (gated) |
| `PostCardPublic` | Author header, blurred interactions |
| `BlogCardPublic` | Cover image, title, author |
| `UserContributorCard` | Avatar, name, bio, project count, follow (gated) |
| `TestimonialCard` | Quote, name, rating |
| `HowItWorksStep` | Step number, icon, title, description |
| `CtaSection` | Gradient background, headline, dual buttons |
| `VTechBrandSection` | Minimal powered-by strip |
| `LandingFooter` | 4-column footer with nav + brand |

---

## Responsive Layout Summary

| Viewport | Hero | Cards | Steps | Footer |
|----------|------|-------|-------|--------|
| Mobile (<640px) | Stacked, text center | 1 column | Vertical list | 1 column |
| Tablet (640-1024px) | 2-col split | 2 columns | 2+2 steps | 2 columns |
| Desktop (>1024px) | 2-col split | 3 columns | 4 horizontal | 4 columns |
