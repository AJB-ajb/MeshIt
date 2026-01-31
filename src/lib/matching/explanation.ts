/**
 * Match Explanation Generation
 * Uses Gemini Flash to generate 2-3 sentence explanations of why a match is good
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.warn(
    "GOOGLE_AI_API_KEY not set. Match explanation generation will fail."
  );
}

export interface ProfileData {
  skills: string[];
  experience_level: string | null;
  availability_hours: number | null;
  interests: string[] | null;
  collaboration_style: string | null;
  bio: string | null;
}

export interface ProjectData {
  title: string;
  description: string;
  required_skills: string[];
  commitment_hours: number | null;
  timeline: string | null;
}

/**
 * Generates a match explanation using Gemini Flash
 * Creates a 2-3 sentence explanation of why the profile and project are a good match
 */
export async function generateMatchExplanation(
  profile: ProfileData,
  project: ProjectData,
  score: number
): Promise<string> {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
  }

  const scorePercent = Math.round(score * 100);

  // Build the prompt
  const prompt = `Given this user profile and project, explain in 2-3 sentences why they are a good match. Focus on specific skill overlaps and relevant experience. Be concise and friendly.

User Profile:
- Skills: ${profile.skills.join(", ") || "Not specified"}
- Experience: ${profile.experience_level || "Not specified"}
- Availability: ${profile.availability_hours ? `${profile.availability_hours} hrs/week` : "Not specified"}
- Interests: ${profile.interests?.join(", ") || "Not specified"}
- Collaboration style: ${profile.collaboration_style || "Not specified"}
- Bio: ${profile.bio || "Not provided"}

Project:
- Title: ${project.title}
- Description: ${project.description}
- Required Skills: ${project.required_skills.join(", ") || "Not specified"}
- Commitment: ${project.commitment_hours ? `${project.commitment_hours} hrs/week` : "Not specified"}
- Timeline: ${project.timeline || "Not specified"}

Match Score: ${scorePercent}%

Explanation:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}. ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    const explanation =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!explanation) {
      throw new Error("Invalid explanation response from Gemini API");
    }

    return explanation;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to generate match explanation: ${String(error)}`);
  }
}

/**
 * Generates explanations for multiple matches in batch
 * Uses Promise.all for parallel processing
 */
export async function generateMatchExplanations(
  matches: Array<{
    profile: ProfileData;
    project: ProjectData;
    score: number;
  }>
): Promise<string[]> {
  const promises = matches.map((match) =>
    generateMatchExplanation(match.profile, match.project, match.score).catch(
      (error) => {
        console.error("Failed to generate explanation:", error);
        return null; // Return null on error, caller can handle
      }
    )
  );

  const results = await Promise.all(promises);
  return results.filter((r): r is string => r !== null);
}
