/**
 * Validācijas starpprogrammatūras reģistrācijai un autorizācijai
 *
 * Validācijas parametri:
 * - Lietotājvārds (username): no 3 līdz 20 simboliem (cipari nav obligāti)
 * - Vārds (fname): līdz 50 simboliem, bez cipariem
 * - Uzvārds (surname): līdz 50 simboliem, bez cipariem
 * - E-pasts (email): līdz 50 simboliem, derīgs e-pasta formāts
 * - Tālruņa numurs (phone_number): no 7 līdz 15 simboliem, cipari un neobligāti '+', '(', ')', '-', atstarpes
 * - Parole (password): no 8 līdz 50 simboliem, burti un vismaz viens cipars
 */

const fnameRegex = /^[^\d]+$/;
const lnameRegex = /^[^\d]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
const phoneNumberRegex = /^\+?[0-9\s\-()]{7,15}$/;

/**
 * Reģistrācijas ievades datu validācija
 */
export function validateRegister(req, res, next) {
  const { username, fname, surname, email, phone_number, password } = req.body;
  const errors = [];

  // 1. Lietotājvārds (username): min 3, max 20, cipari nav obligāti
  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push({ field: 'username', message: 'Lietotājvārds ir obligāts lauks.' });
  } else {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      errors.push({ field: 'username', message: 'Lietotājvārda garumam jābūt no 3 līdz 20 simboliem.' });
    } else if (!usernameRegex.test(trimmedUsername)) {
      errors.push({ field: 'username', message: 'Lietotājvārdā atļauti tikai burti, cipari un simboli "_", "-", "." (3-20 simboli).' });
    }
  }

  // 2. Vārds (fname): max 50, bez cipariem
  if (!fname || typeof fname !== 'string' || !fname.trim()) {
    errors.push({ field: 'fname', message: 'Vārds ir obligāts lauks.' });
  } else {
    const trimmedFname = fname.trim();
    if (trimmedFname.length > 50) {
      errors.push({ field: 'fname', message: 'Vārds nedrīkst pārsniegt 50 simbolus.' });
    } else if (!fnameRegex.test(trimmedFname)) {
      errors.push({ field: 'fname', message: 'Vārds nedrīkst saturēt ciparus.' });
    }
  }

  // 3. Uzvārds (surname): max 50, bez cipariem
  if (!surname || typeof surname !== 'string' || !surname.trim()) {
    errors.push({ field: 'surname', message: 'Uzvārds ir obligāts lauks.' });
  } else {
    const trimmedSurname = surname.trim();
    if (trimmedSurname.length > 50) {
      errors.push({ field: 'surname', message: 'Uzvārds nedrīkst pārsniegt 50 simbolus.' });
    } else if (!lnameRegex.test(trimmedSurname)) {
      errors.push({ field: 'surname', message: 'Uzvārds nedrīkst saturēt ciparus.' });
    }
  }

  // 4. E-pasts (email): max 50, pārbauda formātu
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'E-pasts ir obligāts lauks.' });
  } else {
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 50) {
      errors.push({ field: 'email', message: 'E-pasts nedrīkst pārsniegt 50 simbolus.' });
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.push({ field: 'email', message: 'Nederīgs e-pasta adreses formāts.' });
    }
  }

  // 5. Tālruņa numurs (phone_number): min 7, max 15, cipari, un '+' / '(' / ')' / '-' neobligāti
  if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
    errors.push({ field: 'phone_number', message: 'Tālruņa numurs ir obligāts lauks.' });
  } else {
    const cleanedPhone = phone_number.trim();
    if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
      errors.push({ field: 'phone_number', message: 'Tālruņa numura garumam jābūt no 7 līdz 15 simboliem.' });
    } else if (!phoneNumberRegex.test(cleanedPhone)) {
      errors.push({ field: 'phone_number', message: 'Nederīgs tālruņa numura formāts (atļauti 7-15 cipari, kā arī \'+\', \'(\', \')\', \'-\' un atstarpes).' });
    }
  }

  // 6. Parole (password): min 8, max 50, burti un vismaz viens cipars
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Parole ir obligāts lauks.' });
  } else {
    if (password.length < 8 || password.length > 50) {
      errors.push({ field: 'password', message: 'Paroles garumam jābūt no 8 līdz 50 simboliem.' });
    } else if (!passwordRegex.test(password)) {
      errors.push({ field: 'password', message: 'Parolei obligāti jāsatur gan burti, gan vismaz viens cipars (8-50 simboli).' });
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
  const { email, identifier, username, password } = req.body;
  const loginId = email || identifier || username;
  const errors = [];

  if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
    errors.push({ field: 'email', message: 'E-pasta adrese vai lietotājvārds ir obligāts lauks.' });
  } else if (loginId.trim().length > 50) {
    errors.push({ field: 'email', message: 'E-pasta adrese vai lietotājvārds nedrīkst pārsniegt 50 simbolus.' });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push({ field: 'password', message: 'Parole ir obligāts lauks.' });
  } else if (password.length > 50) {
    errors.push({ field: 'password', message: 'Parole nedrīkst pārsniegt 50 simbolus.' });
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
 * Profila atjaunināšanas validācija
 */
export function validateUpdateProfile(req, res, next) {
  const { username, fname, surname, email, phone_number } = req.body;
  const errors = [];

  if (username !== undefined) {
    if (typeof username !== 'string' || !username.trim()) {
      errors.push({ field: 'username', message: 'Lietotājvārds nedrīkst būt tukšs.' });
    } else {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 20) {
        errors.push({ field: 'username', message: 'Lietotājvārda garumam jābūt no 3 līdz 20 simboliem.' });
      } else if (!usernameRegex.test(trimmed)) {
        errors.push({ field: 'username', message: 'Lietotājvārdā atļauti tikai burti, cipari un simboli "_", "-", "." (3-20 simboli).' });
      }
    }
  }

  if (fname !== undefined) {
    if (typeof fname !== 'string' || !fname.trim()) {
      errors.push({ field: 'fname', message: 'Vārds nedrīkst būt tukšs.' });
    } else {
      const trimmed = fname.trim();
      if (trimmed.length > 50) {
        errors.push({ field: 'fname', message: 'Vārds nedrīkst pārsniegt 50 simbolus.' });
      } else if (!fnameRegex.test(trimmed)) {
        errors.push({ field: 'fname', message: 'Vārds nedrīkst saturēt ciparus.' });
      }
    }
  }

  if (surname !== undefined) {
    if (typeof surname !== 'string' || !surname.trim()) {
      errors.push({ field: 'surname', message: 'Uzvārds nedrīkst būt tukšs.' });
    } else {
      const trimmed = surname.trim();
      if (trimmed.length > 50) {
        errors.push({ field: 'surname', message: 'Uzvārds nedrīkst pārsniegt 50 simbolus.' });
      } else if (!lnameRegex.test(trimmed)) {
        errors.push({ field: 'surname', message: 'Uzvārds nedrīkst saturēt ciparus.' });
      }
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !email.trim()) {
      errors.push({ field: 'email', message: 'E-pasts nedrīkst būt tukšs.' });
    } else {
      const trimmed = email.trim();
      if (trimmed.length > 50) {
        errors.push({ field: 'email', message: 'E-pasts nedrīkst pārsniegt 50 simbolus.' });
      } else if (!emailRegex.test(trimmed)) {
        errors.push({ field: 'email', message: 'Nederīgs e-pasta adreses formāts.' });
      }
    }
  }

  if (phone_number !== undefined) {
    if (typeof phone_number !== 'string' || !phone_number.trim()) {
      errors.push({ field: 'phone_number', message: 'Tālruņa numurs nedrīkst būt tukšs.' });
    } else {
      const cleaned = phone_number.trim();
      if (cleaned.length < 7 || cleaned.length > 15) {
        errors.push({ field: 'phone_number', message: 'Tālruņa numura garumam jābūt no 7 līdz 15 simboliem.' });
      } else if (!phoneNumberRegex.test(cleaned)) {
        errors.push({ field: 'phone_number', message: 'Nederīgs tālruņa numura formāts (7-15 cipari).' });
      }
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
 * Paroles maiņas validācija
 */
export function validateChangePassword(req, res, next) {
  const { current_password, new_password } = req.body;
  const errors = [];

  if (!current_password || typeof current_password !== 'string') {
    errors.push({ field: 'current_password', message: 'Pašreizējā parole ir obligāts lauks.' });
  }

  if (!new_password || typeof new_password !== 'string') {
    errors.push({ field: 'new_password', message: 'Jaunā parole ir obligāts lauks.' });
  } else {
    if (new_password.length < 8 || new_password.length > 50) {
      errors.push({ field: 'new_password', message: 'Jaunās paroles garumam jābūt no 8 līdz 50 simboliem.' });
    } else if (!passwordRegex.test(new_password)) {
      errors.push({ field: 'new_password', message: 'Jaunajai parolei jāsatur gan burti, gan vismaz viens cipars (8-50 simboli).' });
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
