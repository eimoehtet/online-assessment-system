import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacherId = user?.id;

  async function fetchData() {
    try {
      const quizzesRes = await apiRoutes.getQuizzesByTeacherId(teacherId);
      setQuizzes(quizzesRes.data.data || []);
    } catch {
      setError('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await apiRoutes.deleteQuiz(id);
        fetchData();
      } catch {
        alert('Failed to delete quiz');
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Quiz Management</h1>
        <button
          onClick={() => navigate('/teacher/quizzes/new')}
          className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          <Plus size={18} />
          Create Quiz
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <LoadingIndicator label="Loading quizzes…" className="col-span-full" /> : quizzes.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            No quizzes found. Create your first quiz to get started!
          </p>
        ) : (
          quizzes.map(quiz => (
            <div key={quiz.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    {quiz.course?.name}
                  </span>
                  <h3 className="mt-1 font-semibold text-slate-950">{quiz.title}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  quiz.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {quiz.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Start Date: {format(new Date(quiz.publishedAt), 'PPp')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>End Date: {format(new Date(quiz.end_date), 'PPp')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Time Limit: {quiz.time_limit ? `${quiz.time_limit} minutes` : 'None'}</span>
                </div>
                <div className="flex items-center gap-2 w-fit bg-red-100 px-2 py-1 rounded-lg cursor-pointer hover:underline hover:text-blue-600" onClick={() => navigate(`/teacher/quizzes/students/${quiz.id}`)}>
                  <Users size={16} />
                  Students List
                </div>
              </div>

              <div className="mt-auto flex gap-2 border-t border-slate-200 pt-4">
                <button
                  onClick={() => navigate(`/teacher/quizzes/edit/${quiz.id}`)}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                  title="Delete quiz"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuizManagement;
