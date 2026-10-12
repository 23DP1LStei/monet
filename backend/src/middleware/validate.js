/**
 * Validācijas starpprogrammatūras reģistrācijai un autorizācijai
 * Izstrādātas atbilstoši dokumenta monet_posms2.docx prasībām:
 * - username: unikāls, līdz 20 simboliem
 * - fname: līdz 50 simboliem
 * - surname: līdz 50 simboliem
 * - email: unikāls, derīgs e-pasta formāts, līdz 255 simboliem
 * - phone_number: unikāls, derīgs tālruņa formāts, līdz 15 simboliem
 * - password: vismaz 7 simboli, obligāti jāsatur gan burti, gan cipari
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,15}$/;

/**
 * Reģistrācijas ievades datu validācija
 */
export function validateRegister(req, res, next) {
  const { username, fname, surname, email, phone_number, password } = req.body;
  const errors = [];

  // 1. Lietotājvārds (username)
  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push({ field: 'username', message: 'Lietotājvārds ir obligāts lauks.' });
  } else if (username.trim().length > 20) {
    errors.push({ field: 'username', message: 'Lietotājvārds nedrīkst pārsniegt 20 simbolus.' });
  }

  // 2. Vārds (fname)
  if (!fname || typeof fname !== 'string' || !fname.trim()) {
    errors.push({ field: 'fname', message: 'Vārds ir obligāts lauks.' });
  } else if (fname.trim().length > 50) {
    errors.push({ field: 'fname', message: 'Vārds nedrīkst pārsniegt 50 simbolus.' });
  }

  // 3. Uzvārds (surname)
  if (!surname || typeof surname !== 'string' || !surname.trim()) {
    errors.push({ field: 'surname', message: 'Uzvārds ir obligāts lauks.' });
  } else if (surname.trim().length > 50) {
    errors.push({ field: 'surname', message: 'Uzvārds nedrīkst pārsniegt 50 simbolus.' });
  }

  // 4. E-pasts (email)
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'E-pasts ir obligāts lauks.' });
  } else if (email.trim().length > 255) {
    errors.push({ field: 'email', message: 'E-pasts nedrīkst pārsniegt 255 simbolus.' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Nederīgs e-pasta adreses formāts.' });
  }

  // 5. Tālruņa numurs (phone_number)
  if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
    errors.push({ field: 'phone_number', message: 'Tālruņa numurs ir obligāts lauks.' });
  } else {
    const cleanedPhone = phone_number.trim();
    if (cleanedPhone.length > 15) {
      errors.push({ field: 'phone_number', message: 'Tālruņa numurs nedrīkst pārsniegt 15 simbolus.' });
    } else if (!PHONE_REGEX.test(cleanedPhone)) {
      errors.push({ field: 'phone_number', message: 'Nederīgs tālruņa numura formāts (piemēram, +37120000000).' });
    }
  }

  // 6. Parole (password): vismaz 7 simboli, obligāti gan burti, gan cipari
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Parole ir obligāts lauks.' });
  } else {
    if (password.length < 7) {
      errors.push({ field: 'password', message: 'Parolei jābūt vismaz 7 simbolu garai.' });
    }
    const hasLetters = /[a-zA-Zа-яА-ЯāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    if (!hasLetters || !hasDigits) {
      errors.push({
        field: 'password',
        message: 'Parolē obligāti jāiekļauj gan burti, gan cipari.',
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Nederīgi ievadīti dati.',
      errors,
    });
  }

  next();
}

/**
 * Autorizācijas (pieteikšanās) ievades datu validācija
 */
export function validateLogin(req, res, next) {
  const { email, identifier, password } = req.body;
  const loginId = email || identifier;
  const errors = [];

  if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
    errors.push({ field: 'email', message: 'E-pasta adrese vai lietotājvārds ir obligāts lauks.' });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push({ field: 'password', message: 'Parole ir obligāts lauks.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Nederīgi ievadīti dati.',
      errors,
    });
  }

  next();
}
