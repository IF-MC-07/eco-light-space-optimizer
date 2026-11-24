import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import { createHolidaySchema, updateHolidaySchema } from '../validations/holiday.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const { year } = req.query;
    const whereClause = {};

    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        whereClause[db.Sequelize.Op.and] = [
          db.Sequelize.where(
            db.Sequelize.fn('EXTRACT', db.Sequelize.literal('YEAR FROM holiday_date')),
            yearNum
          )
        ];
      }
    }

    const holidays = await db.Holiday.findAll({
      where: whereClause,
      order: [['holiday_date', 'ASC'], ['name', 'ASC']],
    });

    const formatted = holidays.map((h) => {
      const item = h.toJSON ? h.toJSON() : h;
      return {
        ...item,
        // Compatibility aliases for legacy client components
        holiday_name: item.name,
        is_national_holiday: item.type === 'nasional',
      };
    });

    return responseFormatter.success(res, formatted, 'Holidays retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const holiday = await db.Holiday.findByPk(req.params.id);
    if (!holiday) {
      return responseFormatter.error(res, 'Holiday not found', 404);
    }
    const item = holiday.toJSON ? holiday.toJSON() : holiday;
    return responseFormatter.success(res, {
      ...item,
      holiday_name: item.name,
      is_national_holiday: item.type === 'nasional',
    }, 'Holiday retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { error, value } = createHolidaySchema.validate(req.body);
    if (error) {
      return responseFormatter.error(res, error.details[0].message, 400);
    }

    // Check duplicate (holiday_date, name)
    const existing = await db.Holiday.findOne({
      where: {
        holiday_date: value.holiday_date,
        name: value.name,
      },
    });

    if (existing) {
      return responseFormatter.error(
        res,
        'Holiday on this date with the same name already exists',
        409
      );
    }

    const created = await db.Holiday.create(value);
    const item = created.toJSON ? created.toJSON() : created;

    return responseFormatter.success(
      res,
      {
        ...item,
        holiday_name: item.name,
        is_national_holiday: item.type === 'nasional',
      },
      'Holiday created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateHolidaySchema.validate(req.body);
    if (error) {
      return responseFormatter.error(res, error.details[0].message, 400);
    }

    const holiday = await db.Holiday.findByPk(req.params.id);
    if (!holiday) {
      return responseFormatter.error(res, 'Holiday not found', 404);
    }

    // If updating date or name, verify uniqueness
    const targetDate = value.holiday_date || holiday.holiday_date;
    const targetName = value.name || holiday.name;

    if (value.holiday_date || value.name) {
      const duplicate = await db.Holiday.findOne({
        where: {
          holiday_date: targetDate,
          name: targetName,
          holiday_id: { [db.Sequelize.Op.ne]: req.params.id },
        },
      });

      if (duplicate) {
        return responseFormatter.error(
          res,
          'Another holiday on this date with the same name already exists',
          409
        );
      }
    }

    await holiday.update(value);
    const item = holiday.toJSON ? holiday.toJSON() : holiday;

    return responseFormatter.success(
      res,
      {
        ...item,
        holiday_name: item.name,
        is_national_holiday: item.type === 'nasional',
      },
      'Holiday updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const holiday = await db.Holiday.findByPk(req.params.id);
    if (!holiday) {
      return responseFormatter.error(res, 'Holiday not found', 404);
    }

    await holiday.destroy();
    return responseFormatter.success(res, null, 'Holiday deleted successfully');
  } catch (error) {
    next(error);
  }
};
