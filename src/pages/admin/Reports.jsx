import { useState, useEffect } from "react";
import { apiRoutes } from "../../api/routes";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const res = await apiRoutes.getQuizzesReportByAdmin();
        console.log("Fetched report data:", res);
        setReportData(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading reports...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz Report</h1>
      {reportData && reportData.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Teacher</th>
                <th className="px-4 py-2">Shift</th>
                <th className="px-4 py-2">Number of Students</th>
                <th className="px-4 py-2">Attendees</th>
                <th className="px-4 py-2">Absences</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {reportData.map((report, index) => (
                <tr key={report.quiz_id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.quiz_title}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.course_name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.teacher_name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.shift}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.number_of_students}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.attendees}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{report.absences}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    <Link to={`/admin/reports/${report.quiz_id}`} className="text-blue-600 hover:underline" aria-label={`View ${report.quiz_title} report`}><Eye size={16} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
      ) : (
        <div className="text-sm text-slate-600">No report data available.</div>
      )}
    </div>
  );
};

export default Reports;
