import apiClient from "./client";

export const apiRoutes = {
  // Auth
  login: (credentials) => apiClient.post("/users/login", credentials),
  forgotPassword: (email) => apiClient.post("/users/forgot-password", { email }),
  resetPasswordWithToken: (token, newPassword) => apiClient.post("/users/reset-password-with-token", { token, newPassword }),

  // Users (Admin)
  getUsers: (params) => apiClient.get("/users", { params }),
  getTeachers: (params) => apiClient.get("/users/teachers", { params }),
  getStudents: (params) => apiClient.get("/users/students", { params }),
  createUser: (userData) => apiClient.post("/users", userData),
  updateUser: (id, userData) => apiClient.patch(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  resetPassword: (id, newPassword) => apiClient.post(`/users/${id}/reset-password`, { newPassword }),
  changePassword: (id, currentPassword, newPassword) => apiClient.post(`/users/${id}/change-password`, { currentPassword, newPassword }),
  toggleUserStatus: (id) => apiClient.post(`/users/${id}/toggle-status`),



  // Courses
  getCourses: (params) => apiClient.get("/courses", { params }),
  getCourseById: (id) => apiClient.get(`/courses/${id}`),
  getCourseByTeacherId: (teacherId) => apiClient.get(`/courses/teacher/${teacherId}`),
  createCourse: (courseData) => apiClient.post("/courses", courseData),
  updateCourse: (id, courseData) => apiClient.patch(`/courses/${id}`, courseData),
  deleteCourse: (id) => apiClient.delete(`/courses/${id}`),

  // Quizzes
  getQuizzes: () => apiClient.get("/quizzes"),
  getQuizById: (id) => apiClient.get(`/quizzes/${id}`),
  getQuizzesByTeacherId: (teacherId) => apiClient.get(`/quizzes/teacher/${teacherId}`),
  createQuiz: (quizData) => apiClient.post("/quizzes", quizData),
  updateQuiz: (id, quizData) => apiClient.put(`/quizzes/${id}`, quizData),
  deleteQuiz: (id) => apiClient.delete(`/quizzes/${id}`),

  // Questions
  getQuestions: (quizId) => apiClient.get(`/quizzes/${quizId}/questions`),
  createQuestion: (quizId, questionData) => apiClient.post(`/quizzes/${quizId}/questions`, questionData),
  updateQuestion: (quizId, questionId, questionData) => apiClient.patch(`/quizzes/${quizId}/questions/${questionId}`, questionData),
  deleteQuestion: (quizId, questionId) => apiClient.delete(`/quizzes/${quizId}/questions/${questionId}`),

  // Enrollments
  getEnrollments: (params) => apiClient.get("/enrollments", { params }),
  createEnrollment: (enrollData) => apiClient.post("/enrollments", enrollData),
  bulkImportEnrollment: (data) => apiClient.post("/enrollments/bulk", data),
  deleteEnrollment: (id) => apiClient.delete(`/enrollments/${id}`),
  getEnrollmentsByCourse: (courseId, params) => apiClient.get(`/enrollments/courses/${courseId}`, { params }),
  getStudentsByQuizIdAndTeacherId: (quizId, teacherId, params) => apiClient.get(`/quizzes/${quizId}/teacher/${teacherId}`, { params }),
  getEnrollmentsByStudent: (studentId) => apiClient.get(`/enrollments/students/${studentId}`),

  // Submissions
  getSubmissions: () => apiClient.get("/submissions"),
  startSubmission: (submissionData) => apiClient.post("/submissions", submissionData),
  getSubmissionById: (id) => apiClient.get(`/submissions/${id}`),
  getSubmissionAnswers: (submissionId) => apiClient.get(`/submissions/${submissionId}/answers`),
  submitAnswer: (submissionId, answerData) => apiClient.post(`/submissions/${submissionId}/answers`, answerData),
  finishSubmission: (submissionId, data = {}) => apiClient.post(`/submissions/${submissionId}/submit`, data),
  gradeSubmissionAnswer: (submissionId, answerId, gradeData) => apiClient.patch(`/submissions/${submissionId}/answers/${answerId}/grade`, gradeData),
  completeSubmissionReview: (submissionId, data = {}) => apiClient.post(`/submissions/${submissionId}/complete-review`, data),
  releaseSubmissionScore: (submissionId) => apiClient.post(`/submissions/${submissionId}/release`),
  recordBehavior: (submissionId, behaviorData) => apiClient.post(`/submissions/${submissionId}/behavior-logs`, behaviorData),
  getBehaviorSummary: (submissionId) => apiClient.get(`/submissions/${submissionId}/behavior-summary`),
};
