import Alert from '../../components/ui/Alert';
import { useState, useEffect } from "react";
import { apiRoutes } from "../../api/routes";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { TableLoadingRow } from '../../components/ui/LoadingIndicator';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const res = await apiRoutes.getQuizzesReportByAdmin({ page });
        setReportData(res.data.data);
        setTotalPages(res.data.meta.totalPages || 1);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [page]);

  if (error) return <Alert className="mb-4">{error}</Alert>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz Report</h1>
      {loading || (reportData && reportData.length > 0) ? (
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
              {loading ? <TableLoadingRow colSpan={9} label="Loading reports…" /> : reportData.map((report, index) => (
                <tr key={report.quiz_id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{(page - 1) * 10 + index + 1}</td>
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
        <div className="flex justify-center gap-2 p-4">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              disabled={page === pageNumber}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                page === pageNumber
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
    </div>
      ) : (
        <div className="text-sm text-slate-600">No report data available.</div>
      )}
    </div>
  );
};

export default Reports;
