import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { FileText, Clock, Play, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentQuizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await apiRoutes.getQuizzes();
        const fetchedAt = Date.now();
        const courseQuizzes = (res.data.data || []).filter(
          q => q.course_id === parseInt(courseId) && q.status === 'PUBLISHED'
        ).map(q => ({
          ...q,
          deadlinePassed: new Date(q.end_date).getTime() <= fetchedAt
        }));
        setQuizzes(courseQuizzes);
      } catch {
        setError('Failed to fetch quizzes for this course');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizAccessByStudentId = async (studentId) => {
    try {
      const res = await apiRoutes.getQuizAccessByUserId(studentId);
      console.log('Fetched quiz access:', res);
      return res.data.quiz_access;
    } catch (err) {
      console.error('Error fetching quiz access:', err);
      return [];
    }
  };

  const handleStartQuiz = async (quizId) => {
    if (window.confirm('Are you ready to start the quiz? The timer will begin immediately.')) {
      try {
        const res = await apiRoutes.startSubmission({ quiz_id: quizId });
        navigate(`/student/quiz/take/${res.data.id}`);
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to start quiz');
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => navigate('/student/courses')} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-200" title="Back to courses">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Available Quizzes</h1>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="space-y-4">
        {loading ? <LoadingIndicator label="Loading quizzes…" /> : quizzes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4" />
            <p className="text-sm">No active quizzes available for this course at the moment.</p>
          </div>
        ) : (
          quizzes.map(quiz => (
            <div key={quiz.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-5">
                <div className="h-fit rounded-xl bg-slate-100 p-4 text-blue-700">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">{quiz.title}</h3>
                  <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:gap-6">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Deadline: {format(new Date(quiz.end_date), 'PPp')}</span>
                    </div>
                    {quiz.time_limit && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Time limit: {quiz.time_limit} minutes</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <AlertCircle size={14} />
                      <span>Attempts: {quiz.allowed_attempts} max</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStartQuiz(quiz.id)}
                disabled={quiz.deadlinePassed}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                <Play size={18} fill="currentColor" />
                {quiz.deadlinePassed ? 'Deadline Passed' : 'Start Quiz'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;
