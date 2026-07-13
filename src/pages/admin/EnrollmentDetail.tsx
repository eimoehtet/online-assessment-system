import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiRoutes } from "../../api/routes";
import Papa from "papaparse";

const parseDateOfBirth = (dateStr: any): string => {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (!trimmed) return "";

  // Split date components on common delimiters
  const parts = trimmed.split(/[^0-9]+/);

  // If there are exactly 3 parts (day, month, year)
  if (parts.length === 3) {
    const p1 = parts[0];
    const p2 = parts[1];
    const p3 = parts[2];

    const num1 = parseInt(p1, 10);
    const num2 = parseInt(p2, 10);
    const num3 = parseInt(p3, 10);

    if (!isNaN(num1) && !isNaN(num2) && !isNaN(num3)) {
      let year = 0;
      let month = 0;
      let day = 0;

      if (p1.length === 4) {
        // Format: YYYY-MM-DD
        year = num1;
        month = num2;
        day = num3;
      } else if (p3.length === 4 || p3.length === 2) {
        // Format: DD/MM/YYYY or MM/DD/YYYY
        year = num3;
        if (p3.length === 2) {
          year = num3 < 50 ? 2000 + num3 : 1900 + num3;
        }

        if (num1 > 12) {
          day = num1;
          month = num2;
        } else if (num2 > 12) {
          day = num2;
          month = num1;
        } else {
          // Default to DD/MM/YYYY
          day = num1;
          month = num2;
        }
      }

      if (year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const yStr = String(year).padStart(4, "0");
        const mStr = String(month).padStart(2, "0");
        const dStr = String(day).padStart(2, "0");
        return `${yStr}-${mStr}-${dStr}`;
      }
    }
  }

  // Fallback to standard JS Date parsing
  const fallbackDate = new Date(trimmed);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate.toISOString().split("T")[0];
  }

  return "";
};

const EnrollmentDetail = () => {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { courseId } = useParams();
  const [importing, setImporting] = useState(false);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      const response = await apiRoutes.getEnrollmentsByCourse(courseId);
      if (response.status == 200) {
        setEnrollment(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching enrollment details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollment();
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
        console.log("Parsed results:", results.data);

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
              errors.push(`Row ${i + 2}: Invalid or missing Date of Birth "${rawDob || ''}" for student "${rawName || rawId || 'at row ' + (i + 2)}"`);
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
            alert(`Validation errors found in CSV:\n\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ""}\n\nPlease fix the date of birth values (use DD/MM/YYYY or YYYY-MM-DD) in your CSV and try again.`);
            setImporting(false);
            return;
          }

          console.log("Parsed students:", students);
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 ">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="border p-2 rounded-md hidden"
        />
        <button
          onClick={() => document.querySelector('input[type="file"]').click()}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 cursor-pointer "
          disabled={importing}
        >
          {importing ? "Importing..." : "Import CSV"}
        </button>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <table className="w-full mb-4">
          <caption className="mb-2">Enrolled Students</caption>
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">No</th>
              <th className="px-4 py-2">Student ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Gender</th>
              <th className="px-4 py-2">D.O.B</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Address</th>
            </tr>
          </thead>

          <tbody>
            {enrollment?.map((enroll, index) => (
              <tr key={enroll.id} className="border-b border-gray-200">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{enroll.student.student_id}</td>
                <td className="px-4 py-2">{enroll.student.name}</td>
                <td className="px-4 py-2">{enroll.student.gender}</td>
                <td className="px-4 py-2">{enroll.student.date_of_birth}</td>
                <td className="px-4 py-2">{enroll.student.email}</td>
                <td className="px-4 py-2">{enroll.student.phone_number}</td>
                <td className="px-4 py-2">{enroll.student.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnrollmentDetail;
