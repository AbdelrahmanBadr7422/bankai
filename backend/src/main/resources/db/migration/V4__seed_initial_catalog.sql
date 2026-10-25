-- Initial catalogue: 5 categories and 15 books. Runs once, on top of V1-V3.
-- Does not touch users, addresses, carts, orders or payments.

INSERT INTO categories (name, description) VALUES
                                               ('Fiction',           'Classic and contemporary novels.'),
                                               ('Fantasy',           'Epic quests, magic and invented worlds.'),
                                               ('Science Fiction',   'Speculative stories about technology, space and the future.'),
                                               ('Non-Fiction',       'History, science and ideas explained for general readers.'),
                                               ('Technology',        'Software engineering and computing for working developers.');

INSERT INTO products (title, description, author, isbn, price, stock_quantity, cover_image_url, category_id) VALUES

-- Fiction
('To Kill a Mockingbird',
 'A young girl in the American South watches her father, a lawyer, defend a Black man falsely accused of a crime. A story about justice, prejudice and growing up.',
 'Harper Lee', '9780061120084', 12.99, 25,
 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fiction')),

('1984',
 'A clerk in a totalitarian state begins to question the Party that watches everything he does. A landmark dystopian novel about surveillance and truth.',
 'George Orwell', '9780451524935', 9.99, 40,
 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fiction')),

('The Great Gatsby',
 'Nick Carraway watches his mysterious neighbour chase a lost love in 1920s Long Island. A short, sharp novel about ambition and the American Dream.',
 'F. Scott Fitzgerald', '9780743273565', 10.99, 30,
 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fiction')),

('Pride and Prejudice',
 'Elizabeth Bennet and Mr Darcy must get past first impressions and class expectations in Regency England. Witty and still very readable.',
 'Jane Austen', '9780141439518', 8.99, 35,
 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fiction')),

-- Fantasy
('The Hobbit',
 'Bilbo Baggins, a comfortable hobbit, is swept into a dwarf expedition to reclaim a mountain and its dragon-guarded treasure.',
 'J.R.R. Tolkien', '9780547928227', 14.99, 40,
 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fantasy')),

('A Wizard of Earthsea',
 'Ged, a gifted but proud young wizard, releases a shadow into the world and must hunt it across the sea. The first book of the Earthsea cycle.',
 'Ursula K. Le Guin', '9780547773742', 11.99, 20,
 'https://covers.openlibrary.org/b/isbn/9780547773742-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fantasy')),

('The Name of the Wind',
 'Kvothe, now an innkeeper, tells the story of how he became a legend: his years as a travelling performer, a student at the University and a seeker of dangerous knowledge.',
 'Patrick Rothfuss', '9780756404741', 15.99, 18,
 'https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg',
 (SELECT id FROM categories WHERE name = 'Fantasy')),

-- Science Fiction
('Dune',
 'On the desert planet Arrakis, young Paul Atreides is drawn into a fight over the universe''s most valuable substance. Politics, ecology and prophecy.',
 'Frank Herbert', '9780441172719', 13.99, 28,
 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
 (SELECT id FROM categories WHERE name = 'Science Fiction')),

('Foundation',
 'A mathematician predicts the fall of a galactic empire and sets up a project to shorten the dark age that follows. The first novel in Asimov''s Foundation series.',
 'Isaac Asimov', '9780553293357', 9.99, 22,
 'https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg',
 (SELECT id FROM categories WHERE name = 'Science Fiction')),

('Neuromancer',
 'A washed-up hacker is hired for one last job in cyberspace. The novel that helped define cyberpunk.',
 'William Gibson', '9780441569595', 12.99, 15,
 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg',
 (SELECT id FROM categories WHERE name = 'Science Fiction')),

-- Non-Fiction
('Sapiens: A Brief History of Humankind',
 'A broad history of our species, from early hunter-gatherers to the present, covering the cognitive, agricultural and scientific revolutions.',
 'Yuval Noah Harari', '9780062316097', 18.99, 33,
 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
 (SELECT id FROM categories WHERE name = 'Non-Fiction')),

('A Brief History of Time',
 'Stephen Hawking explains black holes, the Big Bang and the nature of time for readers without a physics degree.',
 'Stephen Hawking', '9780553380163', 16.99, 14,
 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
 (SELECT id FROM categories WHERE name = 'Non-Fiction')),

-- Technology
('Clean Code',
 'A handbook of agile software craftsmanship: how to name things, write small functions and refactor code so other people can read it.',
 'Robert C. Martin', '9780132350884', 39.99, 12,
 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
 (SELECT id FROM categories WHERE name = 'Technology')),

('The Pragmatic Programmer',
 'Practical advice on becoming a better developer, from debugging and tooling to taking responsibility for your work. 20th anniversary edition.',
 'David Thomas, Andrew Hunt', '9780135957059', 44.99, 10,
 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
 (SELECT id FROM categories WHERE name = 'Technology')),

('Designing Data-Intensive Applications',
 'How databases, caches, queues and distributed systems actually work, and how to choose between them when building reliable data systems.',
 'Martin Kleppmann', '9781449373320', 49.99, 8,
 'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
 (SELECT id FROM categories WHERE name = 'Technology'));