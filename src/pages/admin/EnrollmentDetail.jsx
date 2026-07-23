import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiRoutes } from "../../api/routes";
import Papa from "papaparse";
import { ChevronDown } from "lucide-react";
import parseDateOfBirth from "../dateFormat";

const EnrollmentDetail = () => {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { courseId } = useParams();
  const [importing, setImporting] = useState(false);
  const [shiftFilter, setShiftFilter] = useState("MORNING");
  const [nameSearch, setNameSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);


  const fetchEnrollment = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiRoutes.getEnrollmentsByCourse(courseId, { page });
      if (response.status == 200) {
        setEnrollment(response.data.data);
        setTotalPages(response.data.meta.totalPages || 1);
        setCurrentPage(response.data.meta.page || 1);
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
    fetchEnrollment(page);
  };

  useEffect(() => {
    fetchEnrollment(currentPage);
  }, [courseId]);

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
            const rawId = s["ID"];
            const rawName = s["NAME IN LATIN"];
            const rawDob = s["D.O.B"];

            // Skip empty rows
            if (!rawId && !rawName && !rawDob) {
              continue;
            }

            const dobFormatted = parseDateOfBirth(rawDob);
            if (!dobFormatted) {
              errors.push(
                `Row ${i + 2}: Invalid or missing Date of Birth "${rawDob || ""}" for student "${rawName || rawId || "at row " + (i + 2)}"`,
              );
            }

            students.push({
              student_id: rawId,
              name: rawName,
              gender: s["Sex"],
              date_of_birth: new Date(dobFormatted),
              phone_number: s["Contact"],
              major: s["Major"],
              role: "STUDENT",
            });
          }

          if (errors.length > 0) {
            console.error("Validation errors in CSV:", errors);
            alert(
              `Validation errors found in CSV:\n\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ""}\n\nPlease fix the date of birth values (use DD/MM/YYYY or YYYY-MM-DD) in your CSV and try again.`,
            );
            setImporting(false);
            return;
          }

          await apiRoutes.bulkImportEnrollment({
            course_id: courseId,
            students,
          });
          alert("Import successful");
          fetchEnrollment();
        } catch (e) {
          console.error(e);
          alert("Import failed: " + (e.response?.data?.message || e.message));
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
      alert("Student assigned successfully");
      setShowAssignStudentModal(false);
      fetchEnrollment();
    } catch (e) {
      console.error(e);
      alert("Failed to assign student: " + (e.response?.data?.message || e.message));
    }
  };

  const filteredEnrollments = enrollment?.filter((enroll) => {
    const nameMatch = enroll.student.name
      .toLowerCase()
      .includes(nameSearch.toLowerCase());
    const shiftMatch = shiftFilter ? enroll.shift === shiftFilter : true;
    return nameMatch && shiftMatch;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!enrollment) {
    return <div>No enrollment found.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <select
              value={shiftFilter}
              onChange={(event) => setShiftFilter(event.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-44"
            >
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
          <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-500 cursor-pointer" onClick={() =>setShowAssignStudentModal(true)}>
            Assign Student
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
            {importing ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full mb-4">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">D.O.B</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Address</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm text-slate-500">
            {filteredEnrollments?.map((enroll, index) => (
              <tr key={enroll.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4">
                  {index + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-4 ">
                  {enroll.student.student_id}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.name}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.date_of_birth
                    ? new Date(
                        enroll.student.date_of_birth,
                      ).toLocaleDateString()
                    : ""}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.email}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.shift}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.gender}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.phone_number}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {enroll.student.address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <h2 className="text-lg font-semibold mb-4">Assign Student</h2>
            <form className="space-y-4" onSubmit= {handleAssignStudent}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <input
                  type="text"
                  name="student_id"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shift
                </label>
                <select
                  name="shift"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 sm:text-sm"
                >
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
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
