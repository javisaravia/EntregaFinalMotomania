-- 1. Actualizar tabla routes para guardar distancia y tiempo
ALTER TABLE routes 
ADD COLUMN distance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN duration INT DEFAULT 0;

-- 2. Nueva tabla para Comentarios y Fotos
CREATE TABLE IF NOT EXISTS route_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Nueva tabla para Valoraciones (Estrellas)
CREATE TABLE IF NOT EXISTS route_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_route (route_id, user_id),
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
