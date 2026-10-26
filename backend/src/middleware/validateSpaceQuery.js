const SUPPORTED_FIELDS = ['location', 'period', 'limit', 'offset'];
const PENDING_FILTERS = {
  city: 'Pilsētas filtram jāsaskaņo atsevišķs city lauks datubāzē.',
  type: 'Telpas veida filtram jāsaskaņo space_type lauks un atļautie veidi.',
  date: 'Datuma filtram jāsaskaņo rezervāciju pieejamības noteikumi.',
};

/**
 * Pārbauda meklēšanas parametrus un sagatavo tos servisam.
 * Neatbalstītus filtrus nenoklusē, lai rezultāti nebūtu maldinoši.
 */
export function validateSpaceQuery(req, res, next) {
  const errors = [];
  const filters = { location: '', period: 'day', limit: 20, offset: 0 };

  for (const field of Object.keys(req.query)) {
    if (!SUPPORTED_FIELDS.includes(field)) {
      errors.push({
        field,
        message: Object.hasOwn(PENDING_FILTERS, field)
          ? PENDING_FILTERS[field] : 'Neatbalstīts meklēšanas parametrs.',
      });
    }
  }

  const { location, period, limit, offset } = req.query;

  if (location !== undefined) {
    if (typeof location !== 'string' || !location.trim() || location.trim().length > 255) {
      errors.push({ field: 'location', message: 'Lokācijai jābūt tekstam ar 1–255 simboliem.' });
    } else {
      filters.location = location.trim();
    }
  }

  if (period !== undefined) {
    if (period === 'month') {
      errors.push({ field: 'period', message: 'Mēneša cenai jāsaskaņo price_per_month lauks un tarifs.' });
    } else if (typeof period !== 'string' || !['hour', 'day'].includes(period)) {
      errors.push({ field: 'period', message: 'Cenu periodam jābūt hour vai day.' });
    } else {
      filters.period = period;
    }
  }

  for (const [field, value, min, max] of [
    ['limit', limit, 1, 100],
    ['offset', offset, 0, Number.MAX_SAFE_INTEGER],
  ]) {
    if (value === undefined) continue;
    if (typeof value !== 'string' || !/^\d+$/.test(value) ||
        !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
      errors.push({ field, message: `${field} jābūt veselam skaitlim no ${min} līdz ${max}.` });
    } else {
      filters[field] = Number(value);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Nederīgi meklēšanas parametri.', errors });
  }

  req.spaceFilters = filters;
  next();
}
