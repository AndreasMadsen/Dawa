CREATE DATABASE DB_NAME ENCODING 'UTF-8' LC_COLLATE 'da_DK.UTF-8' LC_CTYPE 'da_DK.UTF-8' TEMPLATE template0;
ALTER DATABASE DB_NAME SET cursor_tuple_fraction = 0.001;
ALTER DATABASE DB_NAME SET random_page_cost = 1.1;
ALTER DATABASE DB_NAME SET effective_cache_size='7GB';

\c DB_NAME ;
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;