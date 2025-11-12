import { useEffect, useState } from 'react';
import { supabase, type Job } from '../../lib/supabase';
import { Briefcase, MapPin, DollarSign, Clock, Target } from 'lucide-react';
import { JobMatching } from './JobMatching';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
    if (min) return `₹${(min / 100000).toFixed(1)}L+`;
    return `Up to ₹${(max! / 100000).toFixed(1)}L`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-slate-100 text-slate-700';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading jobs...</div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs posted yet</h3>
        <p className="text-slate-600">Post your first job to start matching candidates</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-slate-600 font-medium mb-2">{job.company}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                {job.job_type}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                {job.min_experience}-{job.max_experience || '+'} years
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                {formatSalary(job.salary_range_min, job.salary_range_max)}
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{job.description}</p>

            <div className="mb-4">
              <div className="text-xs font-medium text-slate-700 mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.slice(0, 8).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 8 && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">
                    +{job.required_skills.length - 8} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedJob(job)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Target className="w-4 h-4" />
                Find Matches
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <JobMatching job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
}
