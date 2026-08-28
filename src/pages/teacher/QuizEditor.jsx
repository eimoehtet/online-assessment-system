import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import { useAuth } from '../../context/AuthContext';
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical
} from 'lucide-react';

const createTrueFalseOptions = (correctOption = 'TRUE') => [
  { option_text: 'TRUE', is_correct: correctOption === 'TRUE', option_order: 1 },
  { option_text: 'FALSE', is_correct: correctOption === 'FALSE', option_order: 2 }
];

const normalizeTrueFalseOptions = (options = []) => {
  const correctOption = options.find((option) => option.is_correct);
  return createTrueFalseOptions(
    String(correctOption?.option_text || '').toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE'
  );
};

const toLocalDateTimeInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const getTotalPoints = (questions) => questions.reduce(
  (total, question) => total + (Number(question.points) || 0),
  0
);

const QuizEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverQuestionIndex, setDragOverQuestionIndex] = useState(null);
  const { user } = useAuth();
  const teacher_id = user?.id;

  // Unified state for Quiz and Questions
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    end_date: '',
    time_limit: '',
    allowed_attempts: 1,
    status: 'DRAFT',
    questions: []
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const coursesRes = await apiRoutes.getCourseByTeacherId(teacher_id, { limit: 100 });
      setCourses(coursesRes.data.courses || []);

      if (isEditing) {
        const [quizRes, questionsRes] = await Promise.all([
          apiRoutes.getQuizById(id),
          apiRoutes.getQuestions(id)
        ]);
        
        const quiz = quizRes.data;
        setFormData({
          title: quiz.title,
          course_id: quiz.course_id,
          end_date: quiz.end_date ? toLocalDateTimeInput(quiz.end_date) : '',
          time_limit: quiz.time_limit ?? '',
          allowed_attempts: quiz.allowed_attempts,
          status: quiz.status,
          questions: questionsRes.data.map(q => ({
            ...q,
            // Ensure options have necessary fields if coming from backend
            options: q.question_type === 'TRUE_FALSE'
              ? normalizeTrueFalseOptions(q.options)
              : (q.options || [])
          }))
        });
      } else {
        // Add one default question for new quiz
        addQuestion();
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_type: 'MCQ',
          points: 1,
          question_order: prev.questions.length + 1,
          correct_answer: '',
          options: [
            { option_text: '', is_correct: true, option_order: 1 },
            { option_text: '', is_correct: false, option_order: 2 }
          ]
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const duplicateQuestion = (index) => {
    const q = formData.questions[index];
    if (getTotalPoints(formData.questions) + (Number(q.points) || 0) > 100) {
      window.alert('The total points for a quiz should not exceed 100.');
      return;
    }
    const newQ = { 
      ...JSON.parse(JSON.stringify(q)), 
      id: undefined, 
      question_order: formData.questions.length + 1 
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQ]
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];

    if (field === 'points') {
      const proposedTotal = newQuestions.reduce((total, question, questionIndex) => (
        total + (Number(questionIndex === index ? value : question.points) || 0)
      ), 0);

      if (proposedTotal > 100) {
        window.alert('The total points for a quiz should not exceed 100.');
        return;
      }
    }

    newQuestions[index] = { ...newQuestions[index], [field]: value };
    
    // Reset options if changing to non-option type
    if (field === 'question_type' && (value === 'SHORT_Q' || value === 'LONG_Q')) {
      newQuestions[index].options = [];
    } else if (field === 'question_type' && value === 'TRUE_FALSE') {
      newQuestions[index].options = createTrueFalseOptions();
    } else if (field === 'question_type' && value === 'MCQ' && newQuestions[index].options.length === 0) {
      newQuestions[index].options = [
        { option_text: '', is_correct: true, option_order: 1 },
        { option_text: '', is_correct: false, option_order: 2 }
      ];
    }

    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const newQuestions = [...formData.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = { ...newOptions[oIndex], [field]: value };

    // Radio logic for MCQ/TRUE_FALSE
    if (field === 'is_correct' && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== oIndex) opt.is_correct = false;
      });
    }

    newQuestions[qIndex].options = newOptions;
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const addOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push({
      option_text: '',
      is_correct: false,
      option_order: newQuestions[qIndex].options.length + 1
    });
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const moveQuestion = (index, direction) => {
    if ((index === 0 && direction === -1) || (index === formData.questions.length - 1 && direction === 1)) return;
    const newQuestions = [...formData.questions];
    const targetIndex = index + direction;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    // Update question_order
    newQuestions.forEach((q, i) => q.question_order = i + 1);
    
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleQuestionDrop = (dropIndex) => {
    if (draggedQuestionIndex === null || draggedQuestionIndex === dropIndex) {
      setDraggedQuestionIndex(null);
      setDragOverQuestionIndex(null);
      return;
    }

    setFormData(prev => {
      const questions = [...prev.questions];
      const [draggedQuestion] = questions.splice(draggedQuestionIndex, 1);
      questions.splice(dropIndex, 0, draggedQuestion);
      const orderedQuestions = questions.map((question, index) => ({
        ...question,
        question_order: index + 1
      }));
      return { ...prev, questions: orderedQuestions };
    });
    setDraggedQuestionIndex(null);
    setDragOverQuestionIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (getTotalPoints(formData.questions) > 100) {
      window.alert('The total points for a quiz should not exceed 100.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const quizPayload = {
        title: formData.title,
        course_id: parseInt(formData.course_id),
        teacher_id,
        status: formData.status,
        allowed_attempts: parseInt(formData.allowed_attempts),
        end_date: new Date(formData.end_date).toISOString(),
        time_limit: formData.time_limit === '' ? null : parseInt(formData.time_limit, 10)
      };

      let quizId = id;
      if (isEditing) {
        await apiRoutes.updateQuiz(id, quizPayload);
      } else {
        const res = await apiRoutes.createQuiz(quizPayload);
        quizId = res.data.id;
      }

      // Handle Questions
      // This is a naive implementation: it will create/update one by one.
      // In a real app, you'd want a bulk endpoint or more sophisticated diffing.
      
      // Get existing questions to know which ones to delete
      const existingQuestionsRes = await apiRoutes.getQuestions(quizId);
      const existingQuestions = existingQuestionsRes.data;
      const currentIds = formData.questions.map(q => q.id).filter(Boolean);
      const toDelete = existingQuestions.filter(q => !currentIds.includes(q.id));

      // Deletions
      await Promise.all(toDelete.map(q => apiRoutes.deleteQuestion(quizId, q.id)));

      // Updates and Creates
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        const qPayload = {
          question_text: q.question_text,
          question_type: q.question_type,
          points: parseInt(q.points),
          question_order: i + 1,
          correct_answer: q.correct_answer || null,
          options: q.options.map((opt, oi) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            option_order: oi + 1
          }))
        };

        if (q.id) {
          await apiRoutes.updateQuestion(quizId, q.id, qPayload);
        } else {
          await apiRoutes.createQuestion(quizId, qPayload);
        }
      }

      alert('Quiz and all questions saved successfully!');
      if (!isEditing) navigate(`/teacher/quizzes/edit/${quizId}`);
      else fetchInitialData(); // Refresh to get correct IDs from DB
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save quiz. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingIndicator label="Loading quiz editor…" />;

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <header className="sticky top-16 z-20 mb-8 flex flex-col gap-4 border-b border-slate-200 bg-slate-50/95 py-4 backdrop-blur md:top-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate('/teacher/quizzes')} className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-200" title="Back to quizzes">
            <ArrowLeft size={24} />
          </button>
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">{isEditing ? `Editing Quiz: ${formData.title}` : 'Create New Quiz'}</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/quizzes')}
            className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </header>

      {error && <div className="sticky top-32 z-10 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:top-20">{error}</div>}

      <div className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        {/* Sidebar: Quiz Details */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-slate-950">Quiz Details</h2>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="title" value={formData.title} onChange={handleQuizChange} required placeholder="Quiz Title" />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Course</label>
              <select name="course_id" value={formData.course_id} onChange={handleQuizChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Deadline</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="datetime-local" name="end_date" value={formData.end_date} onChange={handleQuizChange} required />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Time Limit (minutes, optional)</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="number" name="time_limit" value={formData.time_limit} onChange={handleQuizChange} min="1" step="1" placeholder="No time limit" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={formData.status} onChange={handleQuizChange} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-950">Summary</h3>
            <p className="text-sm text-slate-600">Total Questions: {formData.questions.length}</p>
            <p className="text-sm text-slate-600">Total Points: {formData.questions.reduce((acc, q) => acc + (parseInt(q.points) || 0), 0)}</p>
          </div>
        </aside>

        {/* Main: Questions List */}
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Questions</h2>
            <button type="button" onClick={addQuestion} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
              <Plus size={16} />
              Add Question
            </button>
          </div>

          <div className="space-y-6">
            {formData.questions.map((q, qIdx) => (
              <div
                key={qIdx}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverQuestionIndex(qIdx);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleQuestionDrop(qIdx);
                }}
                className={`relative rounded-xl border border-l-4 bg-white p-5 shadow-sm transition ${
                  dragOverQuestionIndex === qIdx && draggedQuestionIndex !== qIdx
                    ? 'border-green-500 border-l-green-600 ring-2 ring-green-200'
                    : 'border-slate-200 border-l-blue-600'
                } ${draggedQuestionIndex === qIdx ? 'opacity-50' : ''}`}
              >
                {/* Question Header */}
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        setDraggedQuestionIndex(qIdx);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(qIdx));
                      }}
                      onDragEnd={() => {
                        setDraggedQuestionIndex(null);
                        setDragOverQuestionIndex(null);
                      }}
                      className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                      title="Drag to reorder question"
                      aria-label={`Drag question ${qIdx + 1} to reorder`}
                    >
                      <GripVertical size={20} />
                    </button>
                    <div className="flex flex-col">
                      <button className="text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0} title="Move question up"><ChevronUp size={16} /></button>
                      <button className="text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === formData.questions.length - 1} title="Move question down"><ChevronDown size={16} /></button>
                    </div>
                    <span className="text-lg font-bold text-slate-950">Question {qIdx + 1}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => duplicateQuestion(qIdx)} title="Duplicate" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"><Copy size={18} /></button>
                    <button type="button" onClick={() => removeQuestion(qIdx)} title="Delete" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 cursor-pointer hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="grid gap-5 lg:grid-cols-[1fr_12rem]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Question Text</label>
                    <textarea
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                      placeholder="Enter your question here..."
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(qIdx, 'question_type', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="MCQ">Multiple Choice</option>
                        <option value="TRUE_FALSE">True / False</option>
                        <option value="SHORT_Q">Short Answer</option>
                        <option value="LONG_Q">Long Answer</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Points</label>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) => handleQuestionChange(qIdx, 'points', e.target.value)}
                        min="0"
                        max="100"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                {(q.question_type === 'MCQ') && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <label className="text-sm font-bold text-slate-700">Options</label>
                      {q.question_type === 'MCQ' && (
                        <button type="button" onClick={() => addOption(qIdx)} className="text-xs cursor-pointer font-bold text-blue-600 transition hover:text-blue-700">+ Add Option</button>
                      )}
                    </div>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="mb-3 flex items-center gap-3 last:mb-0">
                        <button
                          type="button"
                          onClick={() => handleOptionChange(qIdx, oIdx, 'is_correct', true)}
                          className={opt.is_correct ? 'text-green-600 cursor-pointer' : 'text-slate-300 cursor-pointer'}
                          title="Mark correct"
                        >
                          {opt.is_correct ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <input
                          type="text"
                          value={opt.option_text}
                          onChange={(e) => handleOptionChange(qIdx, oIdx, 'option_text', e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        {q.options.length > 2 && q.question_type === 'MCQ' && (
                          <button type="button" onClick={() => removeOption(qIdx, oIdx)} className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Remove option"><Trash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {(q.question_type === 'TRUE_FALSE') && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Correct Answer</label>
                    {q.options.map((opt, oIdx) => (
                      <button
                        key={opt.option_text}
                        type="button"
                        onClick={() => handleOptionChange(qIdx, oIdx, 'is_correct', true)}
                        className={`mb-2 flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left last:mb-0 ${opt.is_correct ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-300 bg-white text-slate-700'}`}
                        title={`Mark ${opt.option_text === 'TRUE' ? 'True' : 'False'} correct`}
                      >
                        {opt.is_correct ? <CheckCircle size={20} /> : <Circle size={20} />}
                        <span className="font-medium">{opt.option_text === 'TRUE' ? 'True' : 'False'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 font-bold text-slate-500 transition hover:border-blue-300 hover:bg-red-50 hover:text-blue-700"
            >
              <Plus size={32} />
              Add Another Question
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuizEditor;
