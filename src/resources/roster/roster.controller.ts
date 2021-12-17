import { crud, query } from "../../utils/crud";
import withActiveSemester from "../../utils/withActiveSemester";

const getMany = crud.readMany("SELECT * FROM roster_view");

const getCourseId = query({
  sql: "SELECT id FROM course WHERE title = ? AND catalog_id = ?",
  using: (req) => [req.body.course.title, req.body.course.catalogId],
  then: (results, req, res) => {
    if (!results.length || !results[0].id)
      throw new Error(
        `No course for title "${req.body.course.title}" and catalog ID "${req.body.course.catalogId}"`
      );
    res.locals.courseId = results[0].id;
  },
});

const getSectionId = query({
  sql: "SELECT id FROM section WHERE course_id = ? and title = ?",
  using: (req, res) => [res.locals.courseId, req.body.course.section],
  then: (results, req, res) => {
    if (!results.length || !results[0].id)
      throw new Error(
        `No section for course ID "${res.locals.courseId}" and section title "${req.body.course.section}"`
      );
    res.locals.sectionId = results[0].id;
  },
});

const withActiveSemesterAndSections = [
  withActiveSemester,
  getCourseId,
  getSectionId,
];

const updateOne = crud.updateOne(
  "UPDATE roster SET ? WHERE id = ?",
  (req, res) => [
    {
      user_id: req.body.student.id,
      course_id: res.locals.courseId,
      semester_id: res.locals.semester.id,
      section_id: res.locals.sectionId,
    },
    req.body.id,
  ]
);

const createOne = crud.createOne("INSERT INTO roster SET ?", (req, res) => [
  {
    user_id: req.body.student.id,
    course_id: res.locals.courseId,
    semester_id: res.locals.semester.id,
    section_id: res.locals.sectionId,
  },
]);

const deleteOne = crud.deleteOne(
  "DELETE FROM roster WHERE id = ?",
  (req) => req.params.id
);

export default {
  createOne: [...withActiveSemesterAndSections, createOne],
  deleteOne,
  getMany,
  updateOne: [...withActiveSemesterAndSections, updateOne],
};
