import pool from "../../utils/db";
import { withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";
import controller from "./equipment.controller";

const setup: EC = (req, res, next) => {
  if (!Array.isArray(req.body) || req.body.length === 0)
    return next("no input");
  res.locals.input = req.body;
  // many equipment can use the same category. only insert new categories once
  res.locals.seen = {
    category: {},
  };
  res.locals.inserts = {
    equipment: [] as EquipmentInput[],
    categories: [],
  };
  res.locals.updates = [] as Equipment[];
  next();
};

interface Category {
  id: number;
  title: string;
}

interface Equipment {
  id: number;
  category: number;
  manufacturer: string;
  model: string;
  description: string;
  sku: string;
  serial: string;
  barcode: string;
  quantity: number;
  notes: string;
  restriction: number;
}

interface EquipmentInput {
  category: string; // maps to Category.title
  manufacturer: string;
  model: string;
  description: string;
  sku: string;
  serial: string;
  barcode: string;
  quantity: string;
  notes: string;
  restriction: number;
}

const process: EC = (_, res, next) => {
  const { input, categories, equipment } = res.locals;
  while (input.length) {
    const inputEquip = input.shift();
    const existingIndex = (equipment as Equipment[]).findIndex(
      (e) => e.id === inputEquip.id
    );
    if (!(inputEquip.category in res.locals.seen.category)) {
      const c = (categories as Category[]).find(
        ({ title }) => title === inputEquip.category
      );
      res.locals.seen.category[inputEquip.category] = c;
      if (!c)
        res.locals.inserts.categories.push({ title: inputEquip.category });
    }
    if (existingIndex > -1) {
      const existing = equipment[existingIndex];

      const c = res.locals.seen.category[inputEquip.category];
      if (c) {
        res.locals.updates.push({
          ...inputEquip,
          id: existing.id,
          category: c.id,
        });
      }
      // TODO update category if needed; skipping for now
      else return next("can't update a category name change this way");
    } else {
      res.locals.inserts.equipment.push(inputEquip);
    }
  }
  next();
};

const insertCategories: EC = (_, res, next) => {
  const {
    inserts: { categories },
  } = res.locals;
  if (!categories.length) return next();
  pool.query(
    "INSERT INTO category (title) VALUES ?",
    [(categories as Category[]).map(({ title }) => [title])],
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

// be sure to refresh categories after inserting new ones
const insertEquipment: EC = (_, res, next) => {
  const {
    categories,
    inserts: { equipment },
  } = res.locals;
  if (!equipment.length) return next();
  pool.query(
    `INSERT INTO equipment (
    category, manufacturer, model, description,
    sku, serial, barcode, quantity, notes, restriction
  ) VALUES ?`,
    [
      (equipment as EquipmentInput[]).map(
        ({
          category,
          manufacturer,
          model,
          description,
          sku,
          serial,
          barcode,
          quantity,
          notes,
          restriction,
        }) => {
          const { id } = (categories as Category[]).find(
            ({ title }) => title === category
          ) || { id: 0 };
          if (id < 1) throw new Error("no category found");
          const qty = Number(quantity);
          if (isNaN(qty))
            throw new Error(
              "invalid quantity: " +
                `${category} ${manufacturer} ${model} ${description} ${sku} ${serial} qty:${quantity}`
            );
          return [
            id,
            manufacturer,
            model,
            description,
            sku,
            serial,
            barcode,
            Number(quantity),
            notes,
            Number(restriction),
          ];
        }
      ),
    ],
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const update: EC = (req, res, next) => {
  const { updates } = res.locals;
  if (!updates.length) return next();
  const e = updates.shift();
  pool.query("UPDATE equipment SET ? WHERE id = ?", [e, e.id], (err) => {
    if (err) next(err);
    update(req, res, next);
  });
};

// fetch updated equpipment and attach to res.locals.results before this
const response: EC = (_, res) => {
  res.status(201).json({ data: res.locals.results });
};

const onError: EEH = (err, _, res, next) => {
  if (typeof err === "string") {
    res.status(400).json({ error: { message: err } });
  } else {
    next(err);
  }
};

export default [
  withResource("equipment", "SELECT * FROM equipment"),
  withResource("categories", "SELECT * FROM category"),
  setup,
  process,
  insertCategories,
  // get new ids for categories
  withResource("categories", "SELECT * FROM category"),
  insertEquipment,
  update,
  // refresh equipment
  controller.getMany,
  response,
  onError,
];
