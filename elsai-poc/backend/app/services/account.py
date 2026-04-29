"""Hash de phrase secrète pour les comptes optionnels (Argon2)."""

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError

    _ph: PasswordHasher | None = PasswordHasher()
except ImportError:  # fallback bcrypt si argon2-cffi absent
    _ph = None
    from passlib.hash import bcrypt as _bcrypt

    VerifyMismatchError = Exception  # type: ignore[assignment,misc]


def hash_phrase(phrase: str) -> str:
    if _ph is not None:
        return _ph.hash(phrase)
    return _bcrypt.hash(phrase)


def verify_phrase(phrase: str, hashed: str) -> bool:
    if _ph is not None:
        try:
            return _ph.verify(hashed, phrase)
        except VerifyMismatchError:
            return False
        except Exception:
            return False
    try:
        return _bcrypt.verify(phrase, hashed)
    except Exception:
        return False
