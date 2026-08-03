
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRoutes } from "../../api/routes";

const QuizReportDetails = () => {
  const { quizId } = useParams();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await apiRoutes.getSubmissionsByQuizId(quizId);
        console.log("Fetched submissions:", response);
        setSubmissions(response.data.data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, [quizId]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quiz Report Details</h1>
      <h2 className="text-xl font-semibold mb-4">Quiz Title: {submissions[0]?.quiz?.title}</h2>
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
          {submissions.map((submission, index) => (
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

