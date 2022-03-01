/*
This periodically clears any locked events
where the locked_time is more than X minutes old.
*/
CREATE EVENT events_clear_locked
ON SCHEDULE EVERY 15 MINUTE
DO UPDATE `event` SET lock_user_id = NULL, locked_time = NULL WHERE locked_time < NOW() - INTERVAL 15 MINUTE;