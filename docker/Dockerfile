ARG PHP_VERSION=8.4
FROM php:${PHP_VERSION}-apache

# MySQL/MariaDB drivers (sources are bundled in the image: no apt needed,
# which keeps very old PHP images buildable).
RUN docker-php-ext-install mysqli pdo_mysql

# Reverse proxy to the internal phpMyAdmin container.
RUN a2enmod rewrite proxy proxy_http
COPY apache/phpmyadmin.conf /etc/apache2/conf-enabled/phpmyadmin.conf
