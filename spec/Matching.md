# Matching

## Overview

This document defines how users and projects are matched based on compatibility across multiple dimensions.

### Design Principles

- **Continuous scales over enums**: Prefer continuous scales with reference points instead of enums
  - Enums need to be extended and predefined, which is inflexible and hard to maintain
- **Principled categories**: Even if factor evaluation is subjective, we define reference points for consistent values across users
- **Natural language input**: Most configuration can be done via natural language (transformed to structured values via AI)
- **Hierarchical defaults**: Most configuration can be on the person-level, with project-level overrides
- **Gradual scoring**: Extrema values are handled gracefully (e.g., 100% remote preference still matches well with 80% remote)
- **Good enough matching**: We cover common cases well; edge cases can be handled manually or by AI. Looking through ten people is acceptable if the top matches are good enough.

### Core Approach

- Weighted filters per user
- Compatibility = combined scores across dimensions
- Two-stage database filtering:
  1. Fast filtering using indexed tables (context identifiers, coarse availability)
  2. Precise matching using complex calculations (AI processing, hour-by-hour availability)
- Keep raw inputs (e.g., "prefer Monday evening") for user editing and display

### User Experience

- Users can see where they differ in preferences to understand compatibility better
- Users can see how certain alignment is, based on missing data

---

## Dimensions

### Person Dimensions

#### Personal Priorities
How strongly a person prioritizes different goals (ratios sum to 1):
- Direct outcome
- Learning
- Socializing

#### Objective Features
Demographics and background (visibility is optional):
- Age
- Profession (e.g., student, PhD, specific profession)
- Industry

#### Skill Level
Self-assessed skill level (0-10 scale, slider input):
- Separate per domain
- Domains are hierarchical (e.g., programming > web development > frontend), extrapolates missing levels if necessary
- Reference points:
  - 1-2: Beginner, learning fundamentals
  - 3-4: Can follow tutorials, build simple projects with guidance
  - 5-6: Intermediate, can work independently on typical tasks
  - 7-8: Advanced, professional-level, can mentor others
  - 9-10: Expert, deep expertise, recognized in field
- Future: Auto-estimate based on time spent on skill and goals achieved

#### Collaboration Style
- **Intensity** (0-10 scale):
  - 0: No collaboration, just submitting together
  - 10: Maximum intensity (pair programming, whiteboard work together)
- **Activities**: Per-activity preference (0-1 scale)
  - Examples: pair programming, whiteboard sessions, code reviews, brainstorming, async review
  - Matching: harmonic mean per activity, then average across activities

#### Location Mode
Percentage of collaboration time spent remote (0-100%):
- 0%: All collaboration in-person
- 100%: All collaboration remote
- Applies to synchronous collaboration time only (solo work not counted)

#### Time Commitment
Total time as fundamental unit:
- **Total time available**: Hours for entire project duration (range, e.g., 40-80h)
- **Duration**: Project length in weeks (range, optional constraint)
- **Collaboration ratio**: Fraction of time spent in synchronous collaboration (0-1)
- **Distance willing to travel**: For in-person collaboration
- **Input formats**: Users can specify "10-20h/week for 4 weeks" → converted to 40-80h total
- **Derived filters**: hours/week, collaboration hours/week (for fast matching)

#### Availability
Two input systems:
- **Week-based**: Weekly pattern with repetition (e.g., "Mondays 6-9pm")
- **Block-based**: Specific dates (e.g., "Jan 15-20")

Availability is often complex:
- Non-fixed availabilities (e.g., "weekends: available in principle", "Monday evening: strongly prefer")
- Weighted time slots with scalar preference levels (0-1 scale)
  - 0: Unavailable
  - 1: Maximum preference
  - Intermediate values for gradual preferences

---

### Project Dimensions

- **Project name**
- **Project description**: Used for AI-based semantic matching
- **Project type**:
  - Coarse category (for fast filtering): Study, Hackathon/Competition, Personal/Side, Professional, Social/Leisure
  - Free-form tags/keywords (matched via overlap or embedding similarity)
- **Context identifier**: Specific hackathon name, course code, etc. (exact string match filter)
- **Natural language criteria**: Optional, for AI-based matching beyond structured dimensions
- **Estimated success probability** (0-1 scale): Measure of project risk for matching risk tolerance
- **Person dimension overrides**: Project-specific overrides of person-level defaults

---

## Compatibility Scoring

### Two-Stage Matching

#### Stage 1: Hard Filters (Pass/Fail)
- Context identifier (exact match if specified)
- Project type category (if filtered)
- Skill level threshold (if minimum specified)
- Location mode (if hard constraint, e.g., "in-person only")

#### Stage 2: Soft Scoring (0-1 Scale)
Remaining dimensions combined via weighted geometric mean.

### Compatibility Formula

**Weighted geometric mean**: `score = Π(sᵢ^wᵢ)^(1/Σwᵢ)`

Where:
- `sᵢ` = score for dimension i (0-1)
- `wᵢ` = weight for dimension i

Behavior:
- Low scores hurt multiplicatively (0.9 × 0.9 × 0.3 → 0.24)
- Zero in any weighted dimension → zero overall
- Consistent with harmonic mean used in per-dimension calculations

### Dimension Weights

User-configurable with category-based defaults:

| Category      | Dimensions                                | Default Weight |
| ------------- | ----------------------------------------- | -------------- |
| Critical      | Availability, Time Commitment             | 1.0            |
| Important     | Skill Level, Collaboration, Location Mode | 0.7            |
| Supplementary | Personal Priorities, Objective Features   | 0.4            |

Users can adjust weights per dimension to reflect their priorities.

### Per-Dimension Score Formulas

| Dimension                | Score Formula                                               |
| ------------------------ | ----------------------------------------------------------- |
| Availability             | Best N hours coverage (see below)                           |
| Time Commitment          | Range overlap ratio                                         |
| Skill Level              | `1 - |levelA - levelB| / 10` (or complementarity score)     |
| Collaboration Intensity  | `1 - |intensityA - intensityB| / 10`                        |
| Collaboration Activities | Harmonic mean per activity, averaged                        |
| Location Mode            | `1 - |remoteA - remoteB| / 100`                             |
| Personal Priorities      | Cosine similarity of priority vectors                       |
| Objective Features       | Age/profession similarity (configurable)                    |

---

## Availability Computation

### Two-Stage Matching
1. **Fast filter**: Coarse availability check (e.g., total hours available) to eliminate obvious mismatches
2. **Precise calculation**: Hour-by-hour computation for remaining candidates

### Per-Hour Compatibility
Harmonic mean of preferences:
- Formula: `2 × pA × pB / (pA + pB)` where pA, pB are user preferences (0-1)
- Behavior: Penalizes large gaps (0.9 vs 0.1 → 0.18), fair when both moderate (0.7 vs 0.5 → 0.58)
- If either preference is 0, compatibility is 0

### Output Metric: Best N Hours Coverage
- N = required collaboration hours/week
- Score = average compatibility of the top N hours
- Directly answers: "Can they meet for the required collaboration time?"

### Data Model

Availability matrix per user:
- **Week-based**: `{ dayOfWeek, hourStart, hourEnd, preference: 0-1 }`
- **Block-based**: `{ date, hourStart, hourEnd, preference: 0-1 }`
- Project duration determines which hours to evaluate

---

## AI Input Processing

Natural language inputs are transformed to structured values via AI:
- Prompt a model to extract structured values from natural language inputs, given the data model
- Examples: "weekends, 10-20h/week" → structured time commitment and availability

---

## Example Postings

These examples illustrate the variety of matching scenarios:

- "AI safety project, Master's level, preference for pair programming, Hamburg, weekends, 10-20h/week, preferred hours 18-22"
- "Theatre project, 4 weeks, all skill levels, evenings/weekends"
- "Course project collaborator, in-person, weekends, 2h direct collaboration"
- "Negotiation practice partner, online, today, 16+"
- "Hackathon teammate for the XHacks hackathon, any skill level, remote, full weekend, posting till in 2 days"
- "Course project partner for data-structures and algorithms, collaboration style: no collaboration, just handing in together, 2+h/week, any skill level"