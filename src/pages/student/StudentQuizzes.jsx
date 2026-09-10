import Alert from '../../components/ui/Alert';
import { confirmAlert } from '../../lib/alerts';
import { showAlert } from '../../lib/alerts';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { FileText, Clock, Play, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentQuizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await apiRoutes.getMyCourseQuizzes(courseId);
        setQuizzes(response.data.quizzes || []);
        setCourse(response.data.course);
        setEnrollment(response.data.enrollment);
      } catch {
        setError('Failed to fetch quizzes for this course');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  const handleStartQuiz = async (quizId) => {
    if (await confirmAlert('Are you ready to start the quiz? The timer will begin immediately.')) {
      try {
        const res = await apiRoutes.startSubmission({ quiz_id: quizId });
        navigate(`/student/quiz/take/${res.data.id}`);
      } catch (err) {
        showAlert(err?.response?.data?.message || 'Failed to start quiz', { variant: 'error' });
      }
    }
  };

  const handleQuizAction = (quiz) => {
    if (quiz.availability === 'ABSENT') return;
    const submission = quiz.latest_submission;

    if (quiz.availability === 'COMPLETED') {
      navigate(`/student/results?quiz_id=${quiz.id}`);
      return;
    }

    if (submission?.status === 'IN_PROGRESS') {
      navigate(`/student/quiz/take/${submission.id}`);
      return;
    }

    handleStartQuiz(quiz.id);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => navigate('/student/courses')} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-200" title="Back to courses">
          <ArrowLeft size={24} />
        </button>
        <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">{course?.name || 'Course Quizzes'}</h1><p className="mt-1 text-sm text-slate-500">{course?.code} · {course?.teacher?.name} · <span className="capitalize">{enrollment?.shift?.toLowerCase()} shift</span></p></div>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-4">
        {loading ? <LoadingIndicator label="Loading quizzes…" /> : quizzes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4" />
            <p className="text-sm">No active quizzes available for this course at the moment.</p>
          </div>
        ) : (
          quizzes.map(quiz => {
            const submission = quiz.latest_submission;
            const isDone = quiz.availability === 'COMPLETED';
            const isUnavailable = ['UPCOMING', 'CLOSED', 'UNAVAILABLE', 'ABSENT'].includes(quiz.availability);

            return (
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
                      <span>Attempts: {quiz.attempts_used} / {quiz.allowed_attempts}</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{quiz.availability.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleQuizAction(quiz)}
                disabled={isUnavailable}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {isDone ? <CheckCircle2 size={18} /> : <Play size={18} fill="currentColor" />}
                {isDone
                  ? 'View Result'
                  : quiz.availability === 'ABSENT'
                    ? 'Absent'
                  : quiz.availability === 'UPCOMING'
                    ? `Opens ${format(new Date(quiz.start_date), 'PPp')}`
                  : quiz.availability === 'CLOSED'
                    ? 'Deadline Passed'
                    : submission
                      ? 'Continue Quiz'
                      : 'Start Quiz'}
              </button>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;
