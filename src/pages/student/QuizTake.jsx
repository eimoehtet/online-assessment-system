import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  Maximize2
} from 'lucide-react';

const QuizTake = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: value }
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Behavioral tracking refs
  const questionStartTime = useRef(0);
  const timeoutSubmitStarted = useRef(false);

  const currentQuestion = questions[currentIndex];

  const fetchQuizData = useCallback(async () => {
    try {
      const subRes = await apiRoutes.getSubmissionById(submissionId);
      const sub = subRes.data;
      
      const quizRes = await apiRoutes.getQuizById(sub.quiz_id);
      setQuiz(quizRes.data);
      
      const questionsRes = await apiRoutes.getQuestions(sub.quiz_id);
      setQuestions(questionsRes.data || []);

      // Initialize answers from existing ones if any
      const existingAnswers = {};
      (sub.answers || []).forEach(a => {
        existingAnswers[a.question_id] = a.student_answer;
      });
      setAnswers(existingAnswers);

      // Setup timer (mocking 30 mins if not specified in quiz? 
      // Actually schema has time_limit as DateTime, usually used as a deadline.
      // But for a quiz take, we might need a duration. 
      // Let's assume 30 minutes for now or use the deadline difference.)
      const deadline = new Date(quizRes.data.time_limit).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      timeoutSubmitStarted.current = false;

      if (!Number.isFinite(deadline) || diff <= 0) {
        setError('This quiz deadline has passed.');
        setTimeLeft(null);
        return;
      }

      setTimeLeft(diff > 1800 ? 1800 : diff); // Cap at 30 mins for demo if deadline is far
      questionStartTime.current = Date.now();

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
  const logBehavior = useCallback(async (eventType, metadata = {}) => {
    if (!currentQuestion) return;
    try {
      await apiRoutes.recordBehavior(submissionId, {
        question_id: currentQuestion.id,
        event_type: eventType,
        metadata
      });
    } catch {
      console.error('Failed to log behavior:', eventType);
    }
  }, [submissionId, currentQuestion]);

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

  const handleAnswerChange = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-save answer to backend
    try {
      await apiRoutes.submitAnswer(submissionId, {
        question_id: questionId,
        student_answer: value
      });
    } catch {
      console.error('Failed to auto-save answer');
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      // Log time spent on current question before moving
      const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
      logBehavior('TIME_SPENT_PER_Q', { seconds: timeSpent });
      
      setCurrentIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      questionStartTime.current = Date.now();
    }
  };

  const finishQuiz = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Final time log
      const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
      await logBehavior('TIME_SPENT_PER_Q', { seconds: timeSpent });
      
      alert('Quiz submitted successfully!');
      navigate('/student/results');
    } catch {
      alert('Failed to complete submission');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, logBehavior, navigate]);

  // Timer Effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && currentQuestion && !timeoutSubmitStarted.current) {
        timeoutSubmitStarted.current = true;
        const submitTimer = setTimeout(finishQuiz, 0);

        return () => clearTimeout(submitTimer);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, finishQuiz, timeLeft]);

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

  if (loading) return <div className="text-sm text-slate-600">Preparing your quiz environment...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>;
  if (!currentQuestion) return <div className="text-sm text-slate-600">No questions found for this quiz.</div>;

  return (
    <div className="mx-auto max-w-4xl pb-8">
      {/* Header with Stats */}
      <header className="sticky top-4 z-20 mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{quiz.title}</h2>
          <p className="mt-1 text-sm text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
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

      {/* Question Card */}
      <main className="flex min-h-[400px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-8">
          <span className="mb-2 block text-sm font-bold text-blue-600">
            {currentQuestion.points} Points • {currentQuestion.question_type}
          </span>
          <h3 className="text-2xl font-semibold leading-snug text-slate-950">{currentQuestion.question_text}</h3>
        </div>

        <div className="flex-1">
          {/* MCQ / True False */}
          {(currentQuestion.question_type === 'MCQ' || currentQuestion.question_type === 'TRUE_FALSE') && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${
                    answers[currentQuestion.id] === option.option_text
                      ? 'border-blue-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    value={option.option_text}
                    checked={answers[currentQuestion.id] === option.option_text}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="size-5 accent-blue-600"
                  />
                  <span className="text-lg text-slate-800">{option.option_text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.question_type === 'SHORT_Q' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          )}

          {/* Long Answer */}
          {currentQuestion.question_type === 'LONG_Q' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Write your detailed answer here..."
              className="min-h-64 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg leading-relaxed outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          )}
        </div>

        {/* Navigation Footer */}
        <footer className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={finishQuiz}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={20} />
              {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
      </main>

      {/* Progress Bar */}
      <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
      </div>
    </div>
  );
};

export default QuizTake;
