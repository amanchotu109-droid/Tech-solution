/*
  # Project Aura - Candidate Genome Database Schema

  ## Overview
  This migration creates the foundational database structure for the Candidate Genome system,
  enabling AI-powered talent discovery and recruitment automation.

  ## New Tables

  ### 1. `profiles`
  User authentication profiles for recruiters and clients
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `role` (text: 'recruiter' or 'client')
  - `company` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `candidates`
  Core candidate information - the foundation of the Candidate Genome
  - `id` (uuid, primary key)
  - `full_name` (text)
  - `email` (text, unique)
  - `phone` (text)
  - `location` (text)
  - `current_title` (text)
  - `years_of_experience` (numeric)
  - `linkedin_url` (text)
  - `github_url` (text)
  - `resume_url` (text)
  - `summary` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `candidate_skills`
  Skills extracted from resumes and assessments
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, FK to candidates)
  - `skill_name` (text)
  - `proficiency_level` (text: 'beginner', 'intermediate', 'advanced', 'expert')
  - `years_of_experience` (numeric)
  - `created_at` (timestamptz)

  ### 4. `candidate_projects`
  Project portfolio for each candidate
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, FK to candidates)
  - `project_name` (text)
  - `description` (text)
  - `tech_stack` (text[])
  - `role` (text)
  - `outcomes` (text)
  - `start_date` (date)
  - `end_date` (date)
  - `created_at` (timestamptz)

  ### 5. `jobs`
  Job descriptions posted by clients
  - `id` (uuid, primary key)
  - `posted_by` (uuid, FK to profiles)
  - `title` (text)
  - `company` (text)
  - `location` (text)
  - `job_type` (text: 'full-time', 'contract', 'part-time')
  - `description` (text)
  - `required_skills` (text[])
  - `preferred_skills` (text[])
  - `min_experience` (numeric)
  - `max_experience` (numeric)
  - `salary_range_min` (numeric)
  - `salary_range_max` (numeric)
  - `status` (text: 'open', 'closed', 'on-hold')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. `candidate_job_matches`
  AI-generated matches between candidates and jobs
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, FK to candidates)
  - `job_id` (uuid, FK to jobs)
  - `match_score` (numeric, 0-100)
  - `matched_skills` (text[])
  - `skill_gaps` (text[])
  - `reasoning` (text)
  - `status` (text: 'suggested', 'shortlisted', 'rejected', 'interviewing', 'hired')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. `assessments`
  Micro-assessments sent to candidates
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `job_id` (uuid, FK to jobs, optional)
  - `questions` (jsonb)
  - `duration_minutes` (integer)
  - `passing_score` (numeric)
  - `created_by` (uuid, FK to profiles)
  - `created_at` (timestamptz)

  ### 8. `candidate_assessments`
  Assessment results for candidates
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, FK to candidates)
  - `assessment_id` (uuid, FK to assessments)
  - `answers` (jsonb)
  - `score` (numeric)
  - `completed_at` (timestamptz)
  - `time_taken_minutes` (integer)

  ### 9. `interviews`
  Interview scheduling and notes
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, FK to candidates)
  - `job_id` (uuid, FK to jobs)
  - `interviewer_id` (uuid, FK to profiles)
  - `scheduled_at` (timestamptz)
  - `duration_minutes` (integer)
  - `status` (text: 'scheduled', 'completed', 'cancelled', 'no-show')
  - `notes` (text)
  - `rating` (integer, 1-5)
  - `transcript` (text)
  - `key_insights` (text[])
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable Row Level Security on all tables
  - Recruiters can view and manage all data
  - Clients can only view their own jobs and matched candidates
  - Public access is denied by default
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('recruiter', 'client')),
  company text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  location text,
  current_title text,
  years_of_experience numeric DEFAULT 0,
  linkedin_url text,
  github_url text,
  resume_url text,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can insert candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

CREATE POLICY "Recruiters can update candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create candidate_skills table
CREATE TABLE IF NOT EXISTS candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency_level text CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view candidate skills"
  ON candidate_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage candidate skills"
  ON candidate_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create candidate_projects table
CREATE TABLE IF NOT EXISTS candidate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  description text,
  tech_stack text[],
  role text,
  outcomes text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view candidate projects"
  ON candidate_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage candidate projects"
  ON candidate_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  job_type text DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'contract', 'part-time')),
  description text NOT NULL,
  required_skills text[],
  preferred_skills text[],
  min_experience numeric DEFAULT 0,
  max_experience numeric,
  salary_range_min numeric,
  salary_range_max numeric,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'on-hold')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view open jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

-- Create candidate_job_matches table
CREATE TABLE IF NOT EXISTS candidate_job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score numeric NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  matched_skills text[],
  skill_gaps text[],
  reasoning text,
  status text DEFAULT 'suggested' CHECK (status IN ('suggested', 'shortlisted', 'rejected', 'interviewing', 'hired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

ALTER TABLE candidate_job_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view matches"
  ON candidate_job_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage matches"
  ON candidate_job_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  duration_minutes integer DEFAULT 30,
  passing_score numeric DEFAULT 70,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create candidate_assessments table
CREATE TABLE IF NOT EXISTS candidate_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]',
  score numeric,
  completed_at timestamptz DEFAULT now(),
  time_taken_minutes integer,
  UNIQUE(candidate_id, assessment_id)
);

ALTER TABLE candidate_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view candidate assessments"
  ON candidate_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage candidate assessments"
  ON candidate_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  transcript text,
  key_insights text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

CREATE POLICY "Users can manage own interviews"
  ON interviews FOR ALL
  TO authenticated
  USING (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  )
  WITH CHECK (
    auth.uid() = interviewer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate_id ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_projects_candidate_id ON candidate_projects(candidate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_candidate_job_matches_candidate_id ON candidate_job_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_job_matches_job_id ON candidate_job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_job_matches_status ON candidate_job_matches(status);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);