SELECT
  cast_to_bool(
    password = AES_ENCRYPT('password', UNHEX(SHA2('not a real passphrase', 512)))
  ) AS passwordsMatch
FROM user
WHERE id = 1