import { supabase, type Candidate, type Job, type CandidateSkill } from './supabase';

type CandidateWithSkills = Candidate & {
  skills: CandidateSkill[];
};

type MatchResult = {
  candidate_id: string;
  match_score: number;
  matched_skills: string[];
  skill_gaps: string[];
  reasoning: string;
};

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

function calculateSkillSimilarity(candidateSkills: string[], requiredSkills: string[]): {
  matched: string[];
  gaps: string[];
  score: number;
} {
  const normalizedCandidateSkills = candidateSkills.map(normalizeSkill);
  const normalizedRequiredSkills = requiredSkills.map(normalizeSkill);

  const matched: string[] = [];
  const gaps: string[] = [];

  for (const required of normalizedRequiredSkills) {
    let found = false;
    for (const candidate of normalizedCandidateSkills) {
      if (candidate === required || candidate.includes(required) || required.includes(candidate)) {
        matched.push(requiredSkills[normalizedRequiredSkills.indexOf(required)]);
        found = true;
        break;
      }
    }
    if (!found) {
      gaps.push(requiredSkills[normalizedRequiredSkills.indexOf(required)]);
    }
  }

  const score = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 100 : 0;

  return { matched, gaps, score };
}

function calculateExperienceScore(
  candidateExp: number,
  minExp: number,
  maxExp: number | null
): number {
  if (candidateExp < minExp) {
    const ratio = candidateExp / minExp;
    return Math.max(0, ratio * 100);
  }

  if (maxExp && candidateExp > maxExp) {
    const excess = candidateExp - maxExp;
    const penalty = Math.min(20, excess * 2);
    return Math.max(70, 100 - penalty);
  }

  return 100;
}

export async function findMatchesForJob(jobId: string): Promise<MatchResult[]> {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    throw new Error('Job not found');
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('*');

  if (candidatesError) {
    throw new Error('Failed to fetch candidates');
  }

  const candidatesWithSkills: CandidateWithSkills[] = await Promise.all(
    (candidates || []).map(async (candidate) => {
      const { data: skills } = await supabase
        .from('candidate_skills')
        .select('*')
        .eq('candidate_id', candidate.id);

      return { ...candidate, skills: skills || [] };
    })
  );

  const results: MatchResult[] = [];

  for (const candidate of candidatesWithSkills) {
    const candidateSkills = candidate.skills.map(s => s.skill_name);

    const skillMatch = calculateSkillSimilarity(candidateSkills, job.required_skills || []);

    const experienceScore = calculateExperienceScore(
      candidate.years_of_experience,
      job.min_experience,
      job.max_experience
    );

    const preferredSkillsMatch = job.preferred_skills?.length
      ? calculateSkillSimilarity(candidateSkills, job.preferred_skills)
      : { matched: [], gaps: [], score: 0 };

    const finalScore = Math.round(
      skillMatch.score * 0.6 +
      experienceScore * 0.3 +
      preferredSkillsMatch.score * 0.1
    );

    let reasoning = `Match based on ${skillMatch.matched.length}/${job.required_skills.length} required skills`;

    if (skillMatch.matched.length > 0) {
      reasoning += `. Strong in: ${skillMatch.matched.slice(0, 3).join(', ')}`;
    }

    if (skillMatch.gaps.length > 0) {
      reasoning += `. Needs to develop: ${skillMatch.gaps.slice(0, 3).join(', ')}`;
    }

    if (preferredSkillsMatch.matched.length > 0) {
      reasoning += `. Also has preferred skills: ${preferredSkillsMatch.matched.slice(0, 2).join(', ')}`;
    }

    results.push({
      candidate_id: candidate.id,
      match_score: finalScore,
      matched_skills: skillMatch.matched,
      skill_gaps: skillMatch.gaps,
      reasoning,
    });
  }

  results.sort((a, b) => b.match_score - a.match_score);

  return results;
}

export async function saveMatches(jobId: string, matches: MatchResult[]): Promise<void> {
  const matchesToInsert = matches.map(match => ({
    job_id: jobId,
    candidate_id: match.candidate_id,
    match_score: match.match_score,
    matched_skills: match.matched_skills,
    skill_gaps: match.skill_gaps,
    reasoning: match.reasoning,
    status: 'suggested' as const,
  }));

  const { error } = await supabase
    .from('candidate_job_matches')
    .upsert(matchesToInsert, {
      onConflict: 'candidate_id,job_id',
    });

  if (error) {
    throw new Error('Failed to save matches');
  }
}
