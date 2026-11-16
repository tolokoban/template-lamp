-- Executed only once, when ./db is empty.
-- Give the "admin" user full rights so it can manage everything from phpMyAdmin.
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
