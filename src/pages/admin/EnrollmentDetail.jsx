import Alert from '../../components/ui/Alert';
import { confirmAlert } from '../../lib/alerts';
import { showAlert } from '../../lib/alerts';
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRoutes } from "../../api/routes";
import Papa from "papaparse";
import { ChevronDown, ChevronLeft, Download, Trash2 } from "lucide-react";
import { TableLoadingRow } from '../../components/ui/LoadingIndicator';

const EnrollmentDetail = () => {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { courseId } = useParams();
  const [importing, setImporting] = useState(false);
  const [shiftFilter, setShiftFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [course, setCourse] = useState(null);


  const fetchEnrollment = async (page = 1) => {
    try {
      setLoading(true);
      const [response, courseResponse] = await Promise.all([apiRoutes.getEnrollmentsByCourse(courseId, { page, search: nameSearch || undefined, shift: shiftFilter || undefined }), apiRoutes.getCourseById(courseId)]);
      setCourse(courseResponse.data.course);
      if (response.status == 200) {
        setEnrollment(response.data.data);
        setTotalPages(response.data.meta.totalPages || 1);
        setCurrentPage(response.data.meta.page || 1);
        setPageSize(response.data.meta.limit || 10);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchEnrollment(currentPage), 300);
    return () => clearTimeout(timer);
  }, [courseId, currentPage, nameSearch, shiftFilter]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    console.log("Uploading file:", file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const students = [];
          const errors = [];

          for (let i = 0; i < results.data.length; i++) {
            const s = results.data[i];

            students.push({
              student_id: s["ID"],
              name: s["Name"],
              gender: s["Gender"],
              major: s["Major"],
              role: "STUDENT",
            });
          }

          if (errors.length > 0) {
            console.error("Validation errors in CSV:", errors);
            showAlert(
              `Validation errors found in CSV:\n\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ""}\n\nPlease fix the date of birth values (use DD/MM/YYYY or YYYY-MM-DD) in your CSV and try again.`,
              { variant: 'error' },
            );
            setImporting(false);
            return;
          }

          await apiRoutes.bulkImportEnrollment({
            course_id: courseId,
            students,
          });
          showAlert("Import successful", { variant: 'success' });
          fetchEnrollment();
        } catch (e) {
          console.error(e);
          showAlert("Import failed: " + (e.response?.data?.message || e.message), { variant: 'error' });
        } finally {
          setImporting(false);
        }
      },
    });
  };

  const handleAssignStudent = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const studentId = formData.get("student_id");
    const shift = formData.get("shift");
    console.log("Assigning student:", studentId, "to course ID:", courseId, "with shift:", shift);

    try {
      await apiRoutes.createEnrollment({courseId, studentId, shift});
      showAlert("Student assigned successfully", { variant: 'success' });
      setShowAssignStudentModal(false);
      fetchEnrollment();
    } catch (e) {
      console.error(e);
      showAlert("Failed to assign student: " + (e.response?.data?.message || e.message), { variant: 'error' });
    }
  };

  const filteredEnrollments = enrollment;

  const removeEnrollment = async (id, studentName) => {
    if (!await confirmAlert(`Are you sure you want to remove ${studentName} from this course? `)) return;
    try {
      await apiRoutes.deleteEnrollment(id);
      showAlert('Student removed from the course successfully.', { variant: 'success' });
      await fetchEnrollment(currentPage);
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to remove enrollment.'); }
  };

  const changeEnrollmentShift = async (enroll, shift) => {
    try {
      await apiRoutes.updateEnrollment(enroll.id, { course_id: enroll.course_id, student_id: enroll.student_id, shift });
      showAlert('Enrollment shift updated successfully.', { variant: 'success' });
      await fetchEnrollment(currentPage);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update enrollment shift.'); }
  };

  const exportRoster = async () => {
    try {
      const first = await apiRoutes.getEnrollmentsByCourse(courseId, { page: 1, limit: 100, search: nameSearch || undefined, shift: shiftFilter || undefined });
      const rows = [...(first.data.data || [])];
      for (let page = 2; page <= first.data.meta.totalPages; page += 1) {
        const response = await apiRoutes.getEnrollmentsByCourse(courseId, { page, limit: 100, search: nameSearch || undefined, shift: shiftFilter || undefined });
        rows.push(...(response.data.data || []));
      }
      const csv = Papa.unparse(rows.map((row) => ({ Student_ID: row.student.student_id, Name: row.student.name, Email: row.student.email, Shift: row.shift, Gender: row.student.gender || '' })));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${course?.code || 'course'}-roster.csv`; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Failed to export this roster.'); }
  };

  if (error) {
    return <Alert>{error}</Alert>;
  }

  return (
    <div>
      <Link to="/admin/courses" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"><ChevronLeft size={17} /> Courses</Link>
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-950">{course?.name || 'Course Roster'}</h1><p className="mt-1 text-sm text-slate-500">{course?.code} · {course?.teacher?.name} </p></div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="border bg-white border-gray-300 p-2 text-sm rounded-md w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <select
              value={shiftFilter}
              onChange={(event) => { setShiftFilter(event.target.value); setCurrentPage(1); }}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-44"
            >
              <option value="">All shifts</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={exportRoster} disabled={!filteredEnrollments?.length} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"><Download size={16} /> Export CSV</button>
          <button className="bg-red-600 text-white text-sm px-4 py-2 rounded-md hover:bg-red-500 cursor-pointer" onClick={() =>setShowAssignStudentModal(true)}>
            Add Student
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="border p-2 rounded-md hidden"
          />
          <button
            onClick={() => document.querySelector('input[type="file"]').click()}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded-md hover:bg-red-500 cursor-pointer "
            disabled={importing}
          >
            {importing ? "Importing..." : "Import Student List"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Major</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? <TableLoadingRow colSpan={6} label="Loading enrolled students…" /> : filteredEnrollments?.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">No enrolled students match the current filters.</td></tr> : filteredEnrollments?.map((enroll, index) => (
              <tr key={enroll.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                  {enroll.student.student_id}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                  {enroll.student.name}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {enroll.student.gender}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {enroll.student.email}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {enroll.student.major}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  <select aria-label={`Shift for ${enroll.student.name}`} value={enroll.shift} onChange={(event) => changeEnrollmentShift(enroll, event.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1"><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="EVENING">Evening</option></select>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => removeEnrollment(enroll.id, enroll.student.name)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 cursor-pointer" title="Remove student from course" aria-label={`Remove ${enroll.student.name} from course`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {/* Numbers Pagination Controls */}
        <div className="flex justify-center gap-2 p-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={currentPage === page}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                page === currentPage
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
      {showAssignStudentModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Add Student</h2>
            <form className="space-y-4" onSubmit= {handleAssignStudent}>
              <span className="text-sm text-slate-500 block mb-4">Student must already exist in the Student List. For new students, please add them to the Student List first.<Link to={`/admin/students`} className="text-blue-500 hover:underline"> Go to Student List</Link></span>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <input
                  type="text"
                  name="student_id"
                  className="mt-1 block p-2 border border-gray-200 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shift
                </label>
                <select
                  name="shift"
                  className="mt-1 p-2 border border-gray-200 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 sm:text-sm"
                >
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Assign
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentDetail;
