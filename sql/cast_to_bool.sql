/*
 * used to cast literal ints to bool (aka tinyint(1))
 * MySQL does not natively allow this with the CAST function
 */
DELIMITER //

CREATE FUNCTION cast_to_bool(n INT) RETURNS BOOLEAN
DETERMINISTIC READS SQL DATA
BEGIN
    RETURN n;
END//