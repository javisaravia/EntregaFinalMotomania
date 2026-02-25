-- SCRIPT DEFINITIVO DE REPARACIÓN PARA MOTOMANÍA 🏍️
-- Ejecuta esto en tu consola de Railway (o phpMyAdmin)

-- 1. Asegurar que la tabla 'routes' tenga la estructura moderna
-- Primero, eliminamos columnas obsoletas si existieran (opcional, pero limpio)
-- ALTER TABLE routes DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;

-- Añadimos las columnas necesarias para guardar el JSON de coordenadas y estadísticas
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS coordinates LONGTEXT NOT NULL AFTER description,
ADD COLUMN IF NOT EXISTS distance DECIMAL(10,2) DEFAULT 0 AFTER coordinates,
ADD COLUMN IF NOT EXISTS duration INT DEFAULT 0 AFTER distance;

-- 2. Asegurar que 'route_comments' existe y tiene las relaciones correctas
CREATE TABLE IF NOT EXISTS route_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Asegurar que 'route_ratings' existe
CREATE TABLE IF NOT EXISTS route_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_route (route_id, user_id),
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
