import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'recruiter' | 'client';
  company: string | null;
  created_at: string;
  updated_at: string;
};

export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  years_of_experience: number;
  linkedin_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type CandidateSkill = {
  id: string;
  candidate_id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience: number;
  created_at: string;
};

export type Job = {
  id: string;
  posted_by: string;
  title: string;
  company: string;
  location: string;
  job_type: 'full-time' | 'contract' | 'part-time';
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience: number;
  max_experience: number | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: 'open' | 'closed' | 'on-hold';
  created_at: string;
  updated_at: string;
};

export type CandidateJobMatch = {
  id: string;
  candidate_id: string;
  job_id: string;
  match_score: number;
  matched_skills: string[];
  skill_gaps: string[];
  reasoning: string | null;
  status: 'suggested' | 'shortlisted' | 'rejected' | 'interviewing' | 'hired';
  created_at: string;
  updated_at: string;
};
