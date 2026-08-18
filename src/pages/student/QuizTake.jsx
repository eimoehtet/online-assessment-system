import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import { 
  Clock, 
  AlertTriangle, 
  Send,
  Maximize2
} from 'lucide-react';

const getCurrentTimestamp = () => Date.now();

const QuizTake = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: value }
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Behavioral tracking refs
  const questionStartTime = useRef(0);
  const activeQuestionId = useRef(null);
  const timeoutSubmitStarted = useRef(false);
  const answerSaveTimers = useRef(new Map());
  const answerSaveQueues = useRef(new Map());

  const fetchQuizData = useCallback(async () => {
    try {
      const subRes = await apiRoutes.getSubmissionById(submissionId);
      const sub = subRes.data;
      
      const quizRes = await apiRoutes.getQuizById(sub.quiz_id);
      setQuiz(quizRes.data);
      
      const questionsRes = await apiRoutes.getQuestions(sub.quiz_id);
      const fetchedQuestions = questionsRes.data || [];
      setQuestions(fetchedQuestions);
      activeQuestionId.current = null;

      // Initialize answers from existing ones if any
      const existingAnswers = {};
      (sub.answers || []).forEach(a => {
        existingAnswers[a.question_id] = a.student_answer;
      });
      setAnswers(existingAnswers);

      // The attempt ends at the quiz deadline or when its optional duration
      // expires, whichever happens first.
      const deadline = new Date(quizRes.data.end_date).getTime();
      const now = getCurrentTimestamp();
      const deadlineSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
      const startedAt = new Date(sub.submitted_at).getTime();
      const durationSeconds = quizRes.data.time_limit == null
        ? Number.POSITIVE_INFINITY
        : Math.max(0, Math.floor((startedAt + quizRes.data.time_limit * 60_000 - now) / 1000));
      const remainingSeconds = Math.min(deadlineSeconds, durationSeconds);
      timeoutSubmitStarted.current = false;

      if (!Number.isFinite(deadline) || remainingSeconds <= 0) {
        setError(deadlineSeconds <= 0 ? 'This quiz deadline has passed.' : 'The time limit for this quiz has expired.');
        setTimeLeft(null);
        return;
      }

      setTimeLeft(remainingSeconds);
      questionStartTime.current = 0;

    } catch {
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    const fetchTimer = setTimeout(fetchQuizData, 0);

    return () => clearTimeout(fetchTimer);
  }, [fetchQuizData]);

  // Behavior Logging Utility
  const logBehavior = useCallback(async (eventType, metadata = {}, questionId = activeQuestionId.current || questions[0]?.id) => {
    if (!questionId) return;
    try {
      await apiRoutes.recordBehavior(submissionId, {
        question_id: questionId,
        event_type: eventType,
        metadata
      });
    } catch {
      console.error('Failed to log behavior:', eventType);
    }
  }, [questions, submissionId]);

  // Event Listeners for behavior tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logBehavior('TAB_SWITCH');
      }
    };

    const handleCopy = () => {
      logBehavior('COPY_ATTEMPT');
      // Optional: prevent copy
      // e.preventDefault();
    };

    const handlePaste = () => {
      logBehavior('PASTE_ATTEMPT');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logBehavior('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [logBehavior]);

  const saveAnswer = useCallback((questionId, value) => {
    const previousSave = answerSaveQueues.current.get(questionId) || Promise.resolve();
    const request = previousSave.catch(() => null).then(() => apiRoutes.submitAnswer(submissionId, {
        question_id: questionId,
        student_answer: value
      }));
    answerSaveQueues.current.set(questionId, request);
    return request;
  }, [submissionId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Debouncing prevents older keystroke requests from overwriting the latest text.
    clearTimeout(answerSaveTimers.current.get(questionId));
    answerSaveTimers.current.set(questionId, setTimeout(() => {
      answerSaveTimers.current.delete(questionId);
      saveAnswer(questionId, value).catch(() => console.error('Failed to save answer'));
    }, 400));
  };

  const focusQuestion = (questionId) => {
    if (activeQuestionId.current === questionId) return;

    const previousQuestionId = activeQuestionId.current;
    if (previousQuestionId && questionStartTime.current) {
      const timeSpent = Math.floor((getCurrentTimestamp() - questionStartTime.current) / 1000);
      logBehavior('TIME_SPENT_PER_Q', { seconds: timeSpent }, previousQuestionId);
    }

    activeQuestionId.current = questionId;
    questionStartTime.current = getCurrentTimestamp();
  };

  const finishQuiz = useCallback(async ({ skipConfirmation = false } = {}) => {
    if (isSubmitting) return;

    if (!skipConfirmation) {
      const unansweredCount = questions.filter((question) => {
        const answer = answers[question.id];
        return answer == null || String(answer).trim() === '';
      }).length;

      if (unansweredCount > 0) {
        const confirmed = window.confirm(
          `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit anyway?`
        );
        if (!confirmed) return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Flush the latest local values before locking the submission.
      answerSaveTimers.current.forEach((timer) => clearTimeout(timer));
      answerSaveTimers.current.clear();
      // Final time log
      const focusedQuestionId = activeQuestionId.current || questions[0]?.id;
      if (focusedQuestionId && questionStartTime.current) {
        const timeSpent = Math.floor((getCurrentTimestamp() - questionStartTime.current) / 1000);
        await logBehavior('TIME_SPENT_PER_Q', { seconds: timeSpent }, focusedQuestionId);
      }
      await apiRoutes.finishSubmission(submissionId, {
        answers: Object.entries(answers).map(([question_id, student_answer]) => ({
          question_id: Number(question_id),
          student_answer,
        })),
      });
      
      alert('Quiz submitted successfully. Your score will be available after teacher review.');
      navigate('/student/results');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to complete submission');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, logBehavior, navigate, questions, submissionId]);

  // Timer Effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && questions.length > 0 && !timeoutSubmitStarted.current) {
        timeoutSubmitStarted.current = true;
        const submitTimer = setTimeout(() => finishQuiz({ skipConfirmation: true }), 0);

        return () => clearTimeout(submitTimer);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [finishQuiz, questions.length, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  if (loading) return <LoadingIndicator label="Preparing your quiz environment…" className="min-h-screen" />;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>;
  if (questions.length === 0) return <div className="text-sm text-slate-600">No questions found for this quiz.</div>;

  const answeredCount = questions.filter((question) => {
    const answer = answers[question.id];
    return answer != null && String(answer).trim() !== '';
  }).length;

  return (
    <div className="mx-auto max-w-4xl pb-8">
      {/* Header with Stats */}
      <header className="sticky top-4 z-20 mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{quiz.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{answeredCount} of {questions.length} answered</p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-slate-950'}`}>
            <Clock size={20} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button onClick={enterFullscreen} className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100" title="Enter Fullscreen">
            <Maximize2 size={20} />
          </button>
        </div>
      </header>

      {/* Security Warning */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <AlertTriangle size={18} />
        <p>Your browser activities (tab switching, copy-paste) are being monitored for academic integrity.</p>
      </div>

      <main className="space-y-6">
        {questions.map((question, index) => (
          <section
            key={question.id}
            onClick={() => focusQuestion(question.id)}
            onFocus={() => focusQuestion(question.id)}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-6">
              <span className="mb-2 block text-sm font-bold text-blue-600">
                Question {index + 1} • {question.points} Points • {question.question_type}
              </span>
              <h3 className="text-xl font-semibold leading-snug text-slate-950 sm:text-2xl">{question.question_text}</h3>
            </div>

            {(question.question_type === 'MCQ' || question.question_type === 'TRUE_FALSE') && (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${
                      answers[question.id] === option.option_text
                        ? 'border-blue-500 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option.option_text}
                      checked={answers[question.id] === option.option_text}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="size-5 accent-blue-600"
                    />
                    <span className="text-lg text-slate-800">{option.option_text}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'SHORT_Q' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            )}

            {question.question_type === 'LONG_Q' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Write your detailed answer here..."
                className="min-h-64 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg leading-relaxed outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            )}
          </section>
        ))}

        <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-sm font-medium text-slate-600">{answeredCount} of {questions.length} questions answered</p>
          <button
            onClick={() => finishQuiz()}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={20} />
            {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
          </button>
        </footer>
      </main>
    </div>
  );
};

export default QuizTake;
