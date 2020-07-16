import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";
import { controllers } from "../../utils/crud";

const query = `
select
    course.id,
    course.name,
    course.is_open,
    course.course_type,
    course.original_course_name,
    json_arrayagg(
      json_object(
        'id',
        user.id,
        'first_name',
        user.first_name,
        'last_name',
        user.last_name
      )
    ) AS managers
  from
    (
      course
      left join user on(
        json_contains(
          course.instructor,
          cast(user.id as json),
          '$'
        )
      )
    )
  group by
    course.id
`;

export const getMany = (req: Request, res: Response) => {
  pool.query(query, (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows, context });
  });
};

export default {
  ...controllers("course", "id"),
  getMany,
};
