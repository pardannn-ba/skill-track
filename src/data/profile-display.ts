/**
 * Helper tampilan profil murni (tanpa dependensi storage/store) sehingga
 * bisa diuji terpisah. Sumber datanya selalu akun yang sedang login.
 */

/**
 * Inisial untuk avatar: dua kata → huruf pertama kata pertama & terakhir;
 * satu kata → huruf pertama kata itu. Contoh "Yazid Farras" → "YF".
 */
export function initialsFromName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }
  return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase();
}

/**
 * Teks di bawah nama pada profil: username jika tersedia, jika tidak
 * ada, fallback ke email. Hanya keduanya benar-benar kosong barulah
 * fallback label "Pelajar" tampil.
 */
export function profileSubtitle(account: {
  username: string;
  email: string;
}): string {
  const username = account.username.trim();
  if (username) {
    return username;
  }
  const email = account.email.trim();
  if (email) {
    return email;
  }
  return "Pelajar";
}
