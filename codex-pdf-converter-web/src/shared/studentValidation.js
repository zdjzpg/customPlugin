const REQUIRED_STUDENT_FIELDS = ['name', 'phone', 'age', 'grade'];

function getMissingStudentFields(student = {}) {
  return REQUIRED_STUDENT_FIELDS.filter((field) => !String(student[field] || '').trim());
}

module.exports = {
  REQUIRED_STUDENT_FIELDS,
  getMissingStudentFields
};
