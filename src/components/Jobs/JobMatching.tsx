import { useState, useEffect } from 'react';
import { supabase, type Job, type Candidate, type CandidateJobMatch } from '../../lib/supabase';
import { findMatchesForJob, saveMatches } from '../../lib/matching';
import { Sparkles, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

type JobMatchingProps = {
  job: Job;
  onClose: () => void;
};

type MatchWithCandidate = CandidateJobMatch & {
  candidate: Candidate;
};

export function JobMatching({ job, onClose }: JobMatchingProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchWithCandidate[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadExistingMatches();
  }, [job.id]);

  const loadExistingMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_job_matches')
        .select('*, candidate:candidates(*)')
        .eq('job_id', job.id)
        .order('match_score', { ascending: false });

      if (error) throw error;

      setMatches((data as any) || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMatches = async () => {
    setGenerating(true);
    try {
      const results = await findMatchesForJob(job.id);
      await saveMatches(job.id, results);
      await loadExistingMatches();
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateMatchStatus = async (matchId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('candidate_job_matches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      if (error) throw error;

      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, status: status as any } : m))
      );
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      suggested: 'bg-slate-100 text-slate-700',
      shortlisted: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      interviewing: 'bg-purple-100 text-purple-700',
      hired: 'bg-green-100 text-green-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-8">
          <div className="text-center">Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600">{job.company}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-600">
              {matches.length} candidates matched
            </div>
            <button
              onClick={generateMatches}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating...' : matches.length > 0 ? 'Regenerate Matches' : 'Generate Matches'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No matches yet</h3>
              <p className="text-slate-600 mb-6">Click "Generate Matches" to find the best candidates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {match.candidate.full_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(match.match_score)}`}>
                          {match.match_score}% Match
                        </span>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {match.candidate.current_title} • {match.candidate.years_of_experience} years exp
                      </div>
                    </div>
                  </div>

                  {match.reasoning && (
                    <p className="text-sm text-slate-700 mb-3 bg-white px-3 py-2 rounded border border-slate-200">
                      {match.reasoning}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {match.matched_skills.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Matched Skills
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.matched_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.skill_gaps.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-orange-700 mb-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Skill Gaps
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.skill_gaps.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => updateMatchStatus(match.id, 'shortlisted')}
                      disabled={match.status === 'shortlisted'}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'interviewing')}
                      disabled={match.status === 'interviewing'}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Interview
                    </button>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'rejected')}
                      disabled={match.status === 'rejected'}
                      className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
