const parseDateOfBirth = (dateStr) => {
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

export default parseDateOfBirth;