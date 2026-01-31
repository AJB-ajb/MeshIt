# Matching
## Example Postings
- "AI safety project, Master's level, preference for pair programming, Hamburg, weekends, 10-20h/week, prefered hours 18-22"
- "Theatre project, 4 weeks, all skill levels, evenings/weekends"
- "Course project collaborator, in-person, weekends, 2h direct collaboration"
- "Negotiation practice partner, online, today, 16+"
- "Hackathon teammate for the XHacks hackathon, any skill level, remote, full weekend, posting till in 2 days"
- "Course project partner for data-structures and algorithms, collaboration style: no collaboration, just handing in together, 2+h/week, any skill level"

## Core Approach
- Weighted filters per user
- Compatibility = combined scores across dimensions
- For databases, use tables for fast filtering
  - For precise matching, use more complex calculations after initial filtering, e.g. AI processing of string inputs
  - Use unverified identities and context identifiers first (precise string match)
  - Compute information for fast filtering (e.g. availability tables) 
    - keep raw inputs (e.g. "prefer monday evening") for user editing and display

- Collaboration style is often a key factor (e.g. pair programming vs. loose collaboration with minimal interaction)

- Most configuration can be done via natural language input (transformed to structured values via AI).
- Most configuration can be done on the person-level, with project-level overrides.

- People can see where they differ in preferences to understand compatibility better.
- People can also see how certain alignment is, based on missing directions.

- Extrema values in one dimensions might need to be handled specially (e.g. someone who only wants in-person matches).
  - However, a person with 100% remote collaboration preference usually matches well with someone with 80% remote preference, so gradual scoring is sensible even here.

- We cannot handle perfection, but we can cover the most common ones well. Edge cases can be handled manually or by AI if needed.
  - Looking through ten people is not a big deal if the top matches are good enough.

## Principles
- Don't use enum dimensions as much as possible, prefer continuous scales with reference points
  - Problem: Enums need to be extended and predefined, which is inflexible and hard to maintain
- Define categories in a principled way
  - Even if the factor evaluation is subjective, we want to have consistent values across users
  - I.e., we define references points for continuous scales

## Person Dimensions
- **Personal Priorities** (How strongly a person prioritizes different goals; ratios sum to 1)
  - Direct outcome
  - Learning
  - Socializing
- **Objective features** (age, industry, correlates with compatibility, visibility is optional)
  - profession (e.g. student, PhD, specific profession etc.)
- **Collaboration:**
  - Collaboration intensity:
    - 0: no collaboration, just submitting together
    - 10: maximum intensity (pair programming, whiteboard work together)
  - Collaboration activities: per-activity preference (0-1 scale)
    - Examples: pair programming, whiteboard sessions, code reviews, brainstorming, async review
    - Matching: weighted overlap using harmonic mean per activity, then average across activities

- **Location Mode** (% of collaboration time spent remote, 0-100%)
  - 0%: All collaboration in-person
  - 100%: All collaboration remote
  - Applies to synchronous collaboration time only (solo work not counted)
- **Time Commitment:** (total time as fundamental unit)
  - Total time available: hours for entire project duration (range, e.g., 40-80h)
  - Duration: project length in weeks (range, optional constraint)
  - Collaboration ratio: fraction of time spent in synchronous collaboration (0-1)
  - Distance willing to travel (for in-person collaboration)
  - Input formats: Users can specify "10-20h/week for 4 weeks" → converted to 40-80h total
  - Derived filters: hours/week, collaboration hours/week (for fast matching)
- **Availability**
  - A. Week-based availability system (weekly pattern and repetition)
  - B. Block-based (specific dates) availability system
- **Skill level:** (0-10 scale, self-assessed, slider input)
  - Separate per domain
  - Domains are hierarchical (e.g. programming > web development > frontend), extrapolates missing levels if necessary
  - Reference points:
    - 1-2: Beginner, learning fundamentals
    - 3-4: Can follow tutorials, build simple projects with guidance
    - 5-6: Intermediate, can work independently on typical tasks
    - 7-8: Advanced, professional-level, can mentor others
    - 9-10: Expert, deep expertise, recognized in field
  - Future: Auto-estimate based on time spent on skill and goals achieved

## Project Dimensions
- **Project name**
- **Project description** (used for AI-based semantic matching)
- **Project type:**
  - Coarse category (for fast filtering): Study, Hackathon/Competition, Personal/Side, Professional, Social/Leisure
  - Free-form tags/keywords (matched via overlap or embedding similarity)
- **Context identifier** (e.g., specific hackathon name, course code) — exact string match filter
- **Natural language criteria** (optional, for AI-based matching beyond structured dimensions)
- **Estimated success probability** (0-1 scale) — measure of project risk
  - For matching risk tolerance between participants
- Any project-specific overrides of person-level dimension defaults


## Availability Considerations
- Availability is often complex (Non-fixed availabilities, possibly moving)
  - E.g. "weekends: available in principle", "Monday evening: strongly prefer"
  - Weighted time slots
  - Scalar preference levels stored per time slot.
    - Scale from 0 (unavailable) to 1 (maximum preference), with intermediate values for gradual preferences

### Availability Computation
Two-stage matching:
1. **Fast filter**: Coarse availability check (e.g. total hours available, other filters) to eliminate obvious mismatches
2. **Precise calculation**: Hour-by-hour computation for remaining candidates

**Per-hour compatibility**: Harmonic mean of preferences
- Formula: `2 × pA × pB / (pA + pB)` where pA, pB are user preferences (0-1)
- Behavior: Penalizes large gaps (0.9 vs 0.1 → 0.18), fair when both moderate (0.7 vs 0.5 → 0.58)
- If either preference is 0, compatibility is 0

**Output metric**: Best N hours coverage
- N = required collaboration hours/week
- Score = average compatibility of the top N hours
- Directly answers: "Can they meet for the required collaboration time?"

**Data model** for availability inputs:
- matching is done via availability matrix per user
- Week-based: `{ dayOfWeek, hourStart, hourEnd, preference: 0-1 }`
- Block-based: `{ date, hourStart, hourEnd, preference: 0-1 }`
- Project duration determines which hours to evaluate


## Overall Compatibility Scoring

### Two-stage matching
1. **Hard filters** (pass/fail):
   - Context identifier (exact match if specified)
   - Project type category (if filtered)
   - Skill level threshold (if minimum specified)
   - Location mode (if hard constraint, e.g., "in-person only")

2. **Soft scoring** (0-1 scale):
   - Remaining dimensions combined via weighted geometric mean

### Compatibility formula
**Weighted geometric mean**: `score = Π(sᵢ^wᵢ)^(1/Σwᵢ)`

Where:
- `sᵢ` = score for dimension i (0-1)
- `wᵢ` = weight for dimension i

Behavior:
- Low scores hurt multiplicatively (0.9 × 0.9 × 0.3 → 0.24)
- Zero in any weighted dimension → zero overall
- Consistent with harmonic mean used in per-dimension calculations

### Dimension weights
User-configurable with category-based defaults:

| Category      | Dimensions                                | Default weight |
| ------------- | ----------------------------------------- | -------------- |
| Critical      | Availability, Time Commitment             | 1.0            |
| Important     | Skill Level, Collaboration, Location Mode | 0.7            |
| Supplementary | Personal Priorities, Objective Features   | 0.4            |

Users can adjust weights per dimension to reflect their priorities.

### Per-dimension score calculation
| Dimension                | Score formula                                        |
| ------------------------ | ---------------------------------------------------- |
| Availability             | Best N hours coverage (see Availability Computation) |
| Time Commitment          | Range overlap ratio                                  |
| Skill Level              | 1 -                                                  | levelA - levelB         | / 10 (similarity) or complementarity score |
| Collaboration Intensity  | 1 -                                                  | intensityA - intensityB | / 10                                       |
| Collaboration Activities | Harmonic mean per activity, averaged                 |
| Location Mode            | 1 -                                                  | remoteA - remoteB       | / 100                                      |
| Personal Priorities      | Cosine similarity of priority vectors                |
| Objective Features       | Age/profession similarity (configurable)             |


## AI Input Processing
- Concept: Prompt a model to extract structured values from natural language inputs, when given the data model.