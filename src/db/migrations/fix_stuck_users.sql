-- Takılı kalan kullanıcıları düzeltme scripti
-- Bu script, rate limiting'de kilitli kalmış kullanıcıların deneme sayaçlarını sıfırlar

-- 1. Sadece kilitli olanları sıfırla (mnemonic_attempts >= 3)
UPDATE users
SET mnemonic_attempts = 0,
    last_mnemonic_attempt = NULL,
    verification_token = NULL,
    verification_token_expires_at = NULL
WHERE mnemonic_attempts >= 3;

-- Alternatif: Tüm kullanıcıların auth alanlarını sıfırla (daha agresif)
-- UPDATE users
-- SET mnemonic_attempts = 0,
--     last_mnemonic_attempt = NULL,
--     verification_token = NULL,
--     verification_token_expires_at = NULL;

-- Kontrol: Kaç kullanıcı etkilendi?
-- SELECT COUNT(*) as reset_user_count FROM users WHERE mnemonic_attempts = 0;
