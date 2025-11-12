import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Briefcase, Target, TrendingUp, Plus, LogOut } from 'lucide-react';
import { CandidateForm } from '../Candidates/CandidateForm';
import { CandidateList } from '../Candidates/CandidateList';
import { JobForm } from '../Jobs/JobForm';
import { JobList } from '../Jobs/JobList';

type DashboardStats = {
  totalCandidates: number;
  totalJobs: number;
  activeMatches: number;
  shortlistedCandidates: number;
};

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs'>('candidates');
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalJobs: 0,
    activeMatches: 0,
    shortlistedCandidates: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      const [candidatesRes, jobsRes, matchesRes] = await Promise.all([
        supabase.from('candidates').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('candidate_job_matches').select('id, status', { count: 'exact' }),
      ]);

      const shortlisted = matchesRes.data?.filter(m => m.status === 'shortlisted').length || 0;

      setStats({
        totalCandidates: candidatesRes.count || 0,
        totalJobs: jobsRes.count || 0,
        activeMatches: matchesRes.count || 0,
        shortlistedCandidates: shortlisted,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isRecruiter = profile?.role === 'recruiter';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Aura</h1>
              <p className="text-sm text-slate-600">AI-Powered Recruitment Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">{profile?.full_name}</div>
                <div className="text-xs text-slate-600 capitalize">{profile?.role}</div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalCandidates}</div>
            <div className="text-sm text-slate-600">Total Candidates</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalJobs}</div>
            <div className="text-sm text-slate-600">Open Jobs</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.activeMatches}</div>
            <div className="text-sm text-slate-600">Active Matches</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.shortlistedCandidates}</div>
            <div className="text-sm text-slate-600">Shortlisted</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex justify-between items-center px-6 py-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                    activeTab === 'candidates'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Candidates
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                    activeTab === 'jobs'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Jobs
                  </span>
                </button>
              </div>

              {isRecruiter && (
                <button
                  onClick={() => {
                    if (activeTab === 'candidates') {
                      setShowCandidateForm(true);
                    } else {
                      setShowJobForm(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {activeTab === 'candidates' ? 'Add Candidate' : 'Post Job'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'candidates' ? (
              <CandidateList key={refreshKey} />
            ) : (
              <JobList key={refreshKey} />
            )}
          </div>
        </div>
      </main>

      {showCandidateForm && (
        <CandidateForm
          onClose={() => setShowCandidateForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showJobForm && (
        <JobForm
          onClose={() => setShowJobForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
