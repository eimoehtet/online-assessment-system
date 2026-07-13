import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { CheckSquare, Trophy, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const StudentResults = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await apiRoutes.getSubmissions();
        setSubmissions(res.data.data || []);
      } catch {
        setError('Failed to fetch your quiz results');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading your results...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Quiz Results</h1>
        <p className="mt-2 text-slate-600">Review your performance and behavioral feedback.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="space-y-5">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <Trophy size={48} className="mx-auto mb-4" />
            <p className="text-sm">You haven't completed any quizzes yet.</p>
          </div>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{sub.quiz?.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Submitted on {format(new Date(sub.submitted_at), 'PPP pp')}</p>
                </div>
                <div className="sm:text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {sub.total_score !== null ? `${sub.total_score} Pts` : 'Pending'}
                  </div>
                  <p className="text-xs text-slate-500">Total Score</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">{sub.answers?.length || 0}</div>
                    <div className="text-xs text-slate-500">Questions Answered</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckSquare size={18} className="text-emerald-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">{sub.answers?.filter(a => a.is_correct).length || 0}</div>
                    <div className="text-xs text-slate-500">Correct Answers</div>
                  </div>
                </div>
                {/* Behavioral Alert if any */}
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">Monitored</div>
                    <div className="text-xs text-slate-500">Integrity Logs Saved</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentResults;
