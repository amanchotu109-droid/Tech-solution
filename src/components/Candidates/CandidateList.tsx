import { useEffect, useState } from 'react';
import { supabase, type Candidate, type CandidateSkill } from '../../lib/supabase';
import { Users, MapPin, Briefcase, Mail, Phone, Linkedin, Github } from 'lucide-react';

type CandidateWithSkills = Candidate & {
  skills: CandidateSkill[];
};

export function CandidateList() {
  const [candidates, setCandidates] = useState<CandidateWithSkills[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      const candidatesWithSkills = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          const { data: skills } = await supabase
            .from('candidate_skills')
            .select('*')
            .eq('candidate_id', candidate.id);

          return { ...candidate, skills: skills || [] };
        })
      );

      setCandidates(candidatesWithSkills);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading candidates...</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No candidates yet</h3>
        <p className="text-slate-600">Add your first candidate to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-1">
                {candidate.full_name}
              </h3>
              {candidate.current_title && (
                <div className="flex items-center text-slate-600 text-sm">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {candidate.current_title}
                </div>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {candidate.years_of_experience} yrs exp
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-slate-600">
              <Mail className="w-4 h-4 mr-2 text-slate-400" />
              {candidate.email}
            </div>
            {candidate.phone && (
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="w-4 h-4 mr-2 text-slate-400" />
                {candidate.phone}
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                {candidate.location}
              </div>
            )}
          </div>

          {candidate.summary && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {candidate.summary}
            </p>
          )}

          {candidate.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {candidate.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                  >
                    {skill.skill_name}
                  </span>
                ))}
                {candidate.skills.length > 6 && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">
                    +{candidate.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {candidate.github_url && (
              <a
                href={candidate.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
