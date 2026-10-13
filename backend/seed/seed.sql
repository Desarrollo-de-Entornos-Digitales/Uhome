BEGIN;

TRUNCATE TABLE
  review,
  favorite,
  vibe_analysis,
  student_profile,
  property_amenities_amenity,
  property,
  amenity,
  "user"
RESTART IDENTITY CASCADE;

INSERT INTO "user" (email, password, "fullName", username, "isActive", "roleId") VALUES
('admin@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Administrador UHome', 'admin', true, (SELECT id FROM role WHERE name = 'admin')),
('carlos.mendoza@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Carlos Mendoza', 'carlosm', true, (SELECT id FROM role WHERE name = 'landlord')),
('laura.gomez@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Laura Gómez', 'lauragomez', true, (SELECT id FROM role WHERE name = 'landlord')),
('ana.torres@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Ana Torres', 'anatorres', true, (SELECT id FROM role WHERE name = 'student')),
('luis.perez@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Luis Pérez', 'luisperez', true, (SELECT id FROM role WHERE name = 'student')),
('maria.rojas@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'María Rojas', 'mariarojas', true, (SELECT id FROM role WHERE name = 'student')),
('jorge.castro@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Jorge Castro', 'jorgecastro', true, (SELECT id FROM role WHERE name = 'student')),
('sofia.vargas@uhome.com', '$2b$10$9eFT46auesf6UthiUHIszurp5sKnADmd6i/ufbT0rUqQJLPJogQWi', 'Sofía Vargas', 'sofiavargas', false, (SELECT id FROM role WHERE name = 'student'));

INSERT INTO student_profile (university, "maxBudget", "maxDistanceToCampus", "safetyPriority", "nightlifePriority", "userId") VALUES
('Universidad de Prueba', 1300000, 800, 'alta', 'baja', 4),
('Universidad de Prueba', 1000000, 1500, 'media', 'media', 5),
('Universidad de Prueba', 900000, 1000, 'alta', 'alta', 6),
('Universidad de Prueba', 800000, 2000, 'baja', 'alta', 7);

INSERT INTO amenity (name) VALUES
('WiFi'),
('Piscina'),
('Gimnasio'),
('Lavandería'),
('Parqueadero'),
('Cocina equipada'),
('Zona de estudio'),
('Vigilancia 24 horas');

INSERT INTO property (name, description, address, latitude, longitude, price, "propertyTypeId", "distanceToCampus", available) VALUES
('Apartamento Chapinero Cómodo', 'Apartamento luminoso de dos habitaciones, cerca de transporte y zonas de comida.', 'Carrera 13 #58-20', 4.6486, -74.0628, 1200000, (SELECT id FROM property_type WHERE name = 'apartamento'), 600, true),
('Casa Compartida Teusaquillo', 'Casa de tres pisos para compartir entre estudiantes, con patio y sala de estar.', 'Calle 34 #19-45', 4.6310, -74.0750, 1800000, (SELECT id FROM property_type WHERE name = 'casa'), 1500, true),
('Habitación Universitaria Centro', 'Habitación individual en apartamento tranquilo, ideal para estudiar.', 'Carrera 7 #22-10', 4.6120, -74.0690, 650000, (SELECT id FROM property_type WHERE name = 'habitación'), 400, true),
('Apartaestudio Moderno Galerías', 'Apartaestudio amoblado con cocineta y buena iluminación.', 'Calle 53 #25-30', 4.6420, -74.0700, 950000, (SELECT id FROM property_type WHERE name = 'apartaestudio'), 800, true),
('Apartamento Familiar Salitre', 'Apartamento amplio de tres habitaciones en conjunto cerrado.', 'Avenida Calle 26 #68-15', 4.6540, -74.1010, 1500000, (SELECT id FROM property_type WHERE name = 'apartamento'), 3200, true),
('Habitación con Baño Privado Chapinero', 'Habitación con baño privado y acceso a cocina compartida.', 'Calle 63 #11-20', 4.6560, -74.0610, 780000, (SELECT id FROM property_type WHERE name = 'habitación'), 700, true),
('Casa Amplia La Soledad', 'Casa de cuatro habitaciones con garaje y zona de lavandería.', 'Carrera 24 #39-12', 4.6280, -74.0720, 2200000, (SELECT id FROM property_type WHERE name = 'casa'), 1100, false),
('Apartaestudio Económico Las Nieves', 'Apartaestudio sencillo y económico para un estudiante.', 'Carrera 8 #20-50', 4.6070, -74.0680, 700000, (SELECT id FROM property_type WHERE name = 'apartaestudio'), 1800, true);

INSERT INTO property_amenities_amenity ("propertyId", "amenityId") VALUES
(1, 1), (1, 4), (1, 7), (1, 8),
(2, 1), (2, 5), (2, 6),
(3, 1), (3, 6), (3, 7),
(4, 1), (4, 3), (4, 4), (4, 8),
(5, 1), (5, 2), (5, 3), (5, 5), (5, 8),
(6, 1), (6, 7),
(7, 1), (7, 4), (7, 5), (7, 6),
(8, 1), (8, 6);

INSERT INTO vibe_analysis ("studentDensity", nightlife, "studySpots", quietness, "essentialSpots", source, "propertyId") VALUES
(5, 3, 4, 3, 5, 'manual', 1),
(4, 4, 3, 2, 4, 'manual', 2),
(3, 2, 5, 5, 3, 'manual', 3),
(5, 4, 4, 3, 5, 'manual', 4),
(2, 1, 3, 5, 3, 'manual', 5),
(4, 3, 4, 3, 4, 'manual', 6),
(3, 2, 3, 4, 3, 'manual', 7),
(4, 3, 3, 2, 4, 'manual', 8);

INSERT INTO review (rating, comment, "userId", "propertyId") VALUES
(5, 'Excelente ubicación, a pocos minutos de la universidad.', 4, 1),
(4, 'Muy buen apartamento, el internet es rápido.', 5, 1),
(3, 'Está bien, pero hay bastante ruido en las noches.', 6, 2),
(5, 'Ideal para estudiar, tranquilo y con buena zona de estudio.', 7, 3),
(4, 'Buena relación entre precio y calidad.', 4, 4),
(2, 'Queda lejos y el transporte demora.', 5, 5),
(5, 'El arrendador es muy atento y todo estaba limpio.', 6, 6),
(4, 'Casa amplia, buena para compartir.', 7, 2);

INSERT INTO favorite ("userId", "propertyId") VALUES
(4, 1),
(4, 4),
(5, 1),
(5, 3),
(6, 6),
(7, 3);

COMMIT;