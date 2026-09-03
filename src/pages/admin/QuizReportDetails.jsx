
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRoutes } from "../../api/routes";

const QuizReportDetails = () => {
  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const [response, insightResponse] = await Promise.all([apiRoutes.getSubmissionsByQuizId(quizId), apiRoutes.getQuizSubmissionInsights(quizId)]);
        setSubmissions(response.data.data || []);
        setInsights(insightResponse.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load this report.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [quizId]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quiz Report Details</h1>
      <h2 className="text-xl font-semibold mb-1">{insights?.quiz?.title || 'Quiz'}</h2>
      <p className="mb-4 text-sm text-slate-500">{insights?.quiz?.course?.code} · {insights?.quiz?.course?.name}</p>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {insights && <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[['Enrolled', insights.participation.enrolled_students], ['Attempted', insights.participation.unique_students], ['No attempt', insights.participation.no_attempt], ['Completion', `${insights.participation.completion_rate}%`], ['Average', insights.scores.average ?? '—'], ['Awaiting grading', insights.awaiting_grading]].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xl font-bold">{value}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">No</th>
            <th className="px-4 py-2">Student ID</th>
            <th className="px-4 py-2">Student Name</th>
            <th className="px-4 py-2">Score</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Feedback</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading report…</td></tr> : submissions.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">No completed attempts for this quiz.</td></tr> : submissions.map((submission, index) => (
            <tr key={submission.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{index + 1}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{submission.student.student_id}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{submission.student.name}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{submission.total_score}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{submission.status}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{submission.feedback || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
};

export default QuizReportDetails;
