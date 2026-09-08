import Alert from '../../components/ui/Alert';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { apiRoutes } from '../../api/routes';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentResultDetail = () => {
  const { submissionId } = useParams();
  const [params] = useSearchParams();
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const detailRes = await apiRoutes.getSubmissionById(submissionId);
        const detail = detailRes.data;
        const [answerRes, attemptsRes] = await Promise.all([
          apiRoutes.getSubmissionAnswers(submissionId),
          apiRoutes.getSubmissions({ quiz_id: detail.quiz_id, workflow: 'COMPLETED', limit: 100, order: 'asc' }),
        ]);
        if (!active) return;
        setSubmission(detail);
        setAnswers((answerRes.data || []).sort((a, b) => (a.question?.question_order || 0) - (b.question?.question_order || 0)));
        setAttemptNumber((attemptsRes.data.data || []).find((item) => item.id === Number(submissionId))?.attempt_number || 1);
      } catch (err) { if (active) setError(err.response?.data?.message || 'Failed to load this result.'); }
      finally { if (active) setLoading(false); }
    };
    load(); return () => { active = false; };
  }, [submissionId]);

  if (loading) return <LoadingIndicator label="Loading result…" />;
  if (!submission) return <Alert>{error || 'Result not found.'}</Alert>;
  const released = submission.status === 'RELEASED';
  const maximum = submission.quiz?.questions?.reduce((sum, question) => sum + (question.points || 0), 0) || 0;
  return <div className="mx-auto max-w-5xl">
    <Link to={`/student/results?${params.toString()}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft size={17} /> Back to results</Link>
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-wide text-blue-700">{submission.quiz?.course?.code} · {submission.quiz?.course?.name}</p><div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold text-slate-950">{submission.quiz?.title}</h1><p className="mt-1 text-sm text-slate-500">Teacher: {submission.quiz?.course?.teacher?.name || '—'} · Attempt {attemptNumber} of {submission.quiz?.allowed_attempts}</p><p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><Clock size={15} /> Submitted {format(new Date(submission.completed_at || submission.submitted_at), 'PPP pp')}</p></div><div className="sm:text-right"><div className="text-3xl font-bold text-blue-700">{released ? `${submission.total_score} / ${maximum}` : 'Awaiting review'}</div>{released && maximum > 0 && <p className="font-semibold text-slate-500">{Math.round(submission.total_score / maximum * 1000) / 10}%</p>}</div></div></header>
    {!released && <Alert variant="info" title="Your quiz was submitted successfully" className="mb-6">Your teacher will review the submission. Scores and feedback will appear after the result is released.</Alert>}
    {released && submission.feedback && <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-950"><h2 className="font-semibold">Overall teacher feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm">{submission.feedback}</p></div>}
    <h2 className="mb-3 text-lg font-semibold text-slate-950">Submitted answers</h2><div className="space-y-4">{answers.map((answer) => { const written = ['SHORT_Q', 'LONG_Q'].includes(answer.question?.question_type); const earned = written ? answer.teacher_points_awarded : answer.points_awarded; return <article key={answer.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Question {answer.question?.question_order} · {answer.question?.question_type.replaceAll('_', ' ')}</p><h3 className="mt-1 font-semibold text-slate-950">{answer.question?.question_text}</h3></div>{released && <div className="flex items-center gap-2 font-semibold text-slate-800">{!written && (answer.is_correct ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-red-600" size={18} />)}{earned || 0} / {answer.question?.points || 0}</div>}</div><div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{answer.student_answer || <span className="text-slate-400">No answer submitted</span>}</div>{released && answer.teacher_feedback && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900"><span className="font-semibold">Teacher feedback: </span>{answer.teacher_feedback}</div>}</article>; })}</div>
  </div>;
};
export default StudentResultDetail;
