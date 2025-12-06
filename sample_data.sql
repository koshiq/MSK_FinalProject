-- Sample Data for Streaming Platform
USE streaming_platform;

-- Insert Production Houses
INSERT INTO MSK_PROD_HOUSE (NAME, STREET_ADDRESS, CITY, STATE, ZIP, DATE_ESTABLISHED) VALUES
('Netflix Studios', '100 Winchester Cir', 'Los Gatos', 'CA', '95032', '1997-08-29'),
('HBO Max', '30 Hudson Yards', 'New York', 'NY', '10001', '1972-11-08'),
('Amazon Studios', '410 Terry Ave N', 'Seattle', 'WA', '98109', '2010-11-16'),
('Apple TV+', '1 Apple Park Way', 'Cupertino', 'CA', '95014', '2019-11-01');

-- Insert Producers
INSERT INTO MSK_PRODUCER (PRODUCER_ID, FIRST_NAME, LAST_NAME, CITY, STATE, EMAIL, PHONE_NUMBER) VALUES
('PROD001', 'David', 'Benioff', 'Los Angeles', 'CA', 'dbenioff@example.com', '555-0101'),
('PROD002', 'Vince', 'Gilligan', 'Albuquerque', 'NM', 'vgilligan@example.com', '555-0102'),
('PROD003', 'Shonda', 'Rhimes', 'Chicago', 'IL', 'srhimes@example.com', '555-0103'),
('PROD004', 'Greg', 'Daniels', 'New York', 'NY', 'gdaniels@example.com', '555-0104'),
('PROD005', 'Ryan', 'Murphy', 'Los Angeles', 'CA', 'rmurphy@example.com', '555-0105'),
('PROD006', 'Taylor', 'Sheridan', 'Austin', 'TX', 'tsheridan@example.com', '555-0106'),
('PROD007', 'Mike', 'Flanagan', 'Los Angeles', 'CA', 'mflanagan@example.com', '555-0107'),
('PROD008', 'Phoebe', 'Waller-Bridge', 'London', 'UK', 'pbridge@example.com', '555-0108');

-- Insert Web Series
INSERT INTO MSK_WEB_SERIES (NAME, NUMBER_OF_EPISODES, RELEASE_DATE, COUNTRY_OF_RELEASE, POSTER_URL, DESCRIPTION) VALUES
('Stranger Things', 42, '2016-07-15', 'United States', '/images/strangerthings.jpg', 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.'),
('The Crown', 60, '2016-11-04', 'United Kingdom', '/images/thecrown.jpg', 'Follows the political rivalries and romance of Queen Elizabeth II''s reign.'),
('The Mandalorian', 24, '2019-11-12', 'United States', '/images/mandalorian.jpg', 'The travels of a lone bounty hunter in the outer reaches of the galaxy.'),
('Breaking Bad', 62, '2008-01-20', 'United States', '/images/breakingbad.jpg', 'A chemistry teacher diagnosed with cancer turns to cooking meth.'),
('Succession', 39, '2018-06-03', 'United States', '/images/succession.jpg', 'The Roy family fights for control of their media empire.'),
('Ted Lasso', 34, '2020-08-14', 'United States', '/images/tedlasso.jpg', 'American football coach hired to manage a British soccer team.'),
('The Witcher', 24, '2019-12-20', 'United States', '/images/thewitcher.jpg', 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.'),
('Wednesday', 8, '2022-11-23', 'United States', '/images/wednesday.jpg', 'Wednesday Addams attends Nevermore Academy and attempts to master her psychic powers.'),
('The Last of Us', 9, '2023-01-15', 'United States', '/images/lastofus.jpg', 'Twenty years after a fungal pandemic, Joel is tasked with escorting a 14-year-old girl across a post-apocalyptic America.'),
('House of the Dragon', 10, '2022-08-21', 'United States', '/images/houseofdragons.jpg', 'An internal succession war within House Targaryen at the height of its power, 172 years before the birth of Daenerys.'),
('The Boys', 32, '2019-07-26', 'United States', '/images/theboys.jpg', 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.'),
('Bridgerton', 24, '2020-12-25', 'United Kingdom', '/images/bridgerton.jpg', 'The eight close-knit siblings of the Bridgerton family look for love and happiness in London high society.'),
('The Bear', 18, '2022-06-23', 'United States', '/images/thebear.jpg', 'A young chef from the fine dining world returns to Chicago to run his family''s sandwich shop.'),
('Yellowstone', 53, '2018-06-20', 'United States', '/images/yellowstone.jpg', 'A ranching family in Montana faces off against others encroaching on their land.'),
('Ozark', 44, '2017-07-21', 'United States', '/images/ozark.jpg', 'A financial advisor relocates his family to the Ozarks and must launder money to appease a drug boss.'),
('Squid Game', 9, '2021-09-17', 'South Korea', '/images/squidgame.jpg', 'Hundreds of cash-strapped contestants accept an invitation to compete in children''s games for a tempting prize.'),
('Dark', 26, '2017-12-01', 'Germany', '/images/dark.jpg', 'A family saga with a supernatural twist, set in a German town where the disappearance of children exposes relationships.'),
('Peaky Blinders', 36, '2013-09-12', 'United Kingdom', '/images/peakyblinders.jpg', 'A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps.'),
('Money Heist', 41, '2017-05-02', 'Spain', '/images/moneyheist.jpg', 'A criminal mastermind manipulates a group of thieves to pull off the biggest heist in recorded history.'),
('The Umbrella Academy', 30, '2019-02-15', 'United States', '/images/theumbrellaacademy.jpg', 'A dysfunctional family of adopted sibling superheroes reunites to solve the mystery of their father''s death.'),
('Cobra Kai', 50, '2018-05-02', 'United States', '/images/cobrakai.jpg', 'Decades after the tournament, Johnny Lawrence seeks redemption by reopening Cobra Kai dojo.');

-- Insert Episodes for Stranger Things
INSERT INTO MSK_EPISODE (SERIES_ID, EPISODE_NO, EPISODE_TITLE, DURATION_MIN, VIEWERS, TECH_INTERRUPTION) VALUES
(1, 1, 'Chapter One: The Vanishing of Will Byers', 47, 15000000, 'N'),
(1, 2, 'Chapter Two: The Weirdo on Maple Street', 55, 14500000, 'N'),
(1, 3, 'Chapter Three: Holly, Jolly', 51, 14200000, 'N'),
(1, 4, 'Chapter Four: The Body', 50, 14800000, 'N'),
(1, 5, 'Chapter Five: The Flea and the Acrobat', 52, 15200000, 'N');

-- Insert Episodes for The Crown
INSERT INTO MSK_EPISODE (SERIES_ID, EPISODE_NO, EPISODE_TITLE, DURATION_MIN, VIEWERS, TECH_INTERRUPTION) VALUES
(2, 1, 'Wolferton Splash', 57, 8000000, 'N'),
(2, 2, 'Hyde Park Corner', 56, 7800000, 'N'),
(2, 3, 'Windsor', 59, 7500000, 'N'),
(2, 4, 'Act of God', 58, 7600000, 'N');

-- Insert Episodes for The Mandalorian
INSERT INTO MSK_EPISODE (SERIES_ID, EPISODE_NO, EPISODE_TITLE, DURATION_MIN, VIEWERS, TECH_INTERRUPTION) VALUES
(3, 1, 'The Mandalorian', 39, 12000000, 'N'),
(3, 2, 'The Child', 32, 13500000, 'N'),
(3, 3, 'The Sin', 37, 12800000, 'N'),
(3, 4, 'Sanctuary', 41, 12200000, 'N');

-- Insert Episodes for Additional Series (sample episodes)
INSERT INTO MSK_EPISODE (SERIES_ID, EPISODE_NO, EPISODE_TITLE, DURATION_MIN, VIEWERS, TECH_INTERRUPTION) VALUES
(7, 1, 'The End''s Beginning', 60, 18500000, 'N'),
(7, 2, 'Four Marks', 62, 17800000, 'N'),
(8, 1, 'Wednesday''s Child Is Full of Woe', 49, 22000000, 'N'),
(8, 2, 'Woe Is the Loneliest Number', 47, 20500000, 'N'),
(9, 1, 'When You''re Lost in the Darkness', 81, 25000000, 'N'),
(9, 2, 'Infected', 53, 23500000, 'N'),
(10, 1, 'The Heirs of the Dragon', 66, 20100000, 'N'),
(10, 2, 'The Rogue Prince', 54, 19200000, 'N'),
(11, 1, 'The Name of the Game', 61, 16000000, 'N'),
(11, 2, 'Cherry', 59, 15500000, 'N'),
(12, 1, 'Diamond of the First Water', 63, 18900000, 'N'),
(12, 2, 'Shock and Delight', 61, 17800000, 'N'),
(13, 1, 'System', 29, 11200000, 'N'),
(13, 2, 'Hands', 33, 10800000, 'N'),
(14, 1, 'Daybreak', 82, 14500000, 'N'),
(14, 2, 'Kill the Messenger', 51, 13900000, 'N'),
(15, 1, 'Sugarwood', 49, 12300000, 'N'),
(15, 2, 'Blue Cat', 51, 11800000, 'N'),
(16, 1, 'Red Light, Green Light', 60, 35000000, 'N'),
(16, 2, 'Hell', 63, 32000000, 'N'),
(17, 1, 'Secrets', 51, 8500000, 'N'),
(17, 2, 'Lies', 44, 8200000, 'N'),
(18, 1, 'Episode 1', 58, 9500000, 'N'),
(18, 2, 'Episode 2', 59, 9200000, 'N'),
(19, 1, 'Episode 1: Do You Know What''s Worth Fighting For', 70, 19000000, 'N'),
(19, 2, 'Episode 2: Before the Hangman''s Noose', 58, 17500000, 'N'),
(20, 1, 'We Only See Each Other at Weddings and Funerals', 58, 14500000, 'N'),
(20, 2, 'Run Boy Run', 50, 13800000, 'N'),
(21, 1, 'Ace Degenerate', 30, 12100000, 'N'),
(21, 2, 'Strike First', 30, 11500000, 'N');

-- Insert Contracts
INSERT INTO MSK_CONTRACTS (PROD_HOUSE_ID, SERIES_ID, START_DATE, END_DATE, RATE_PER_EPISODE, IS_RENEWED) VALUES
(1, 1, '2015-01-01', '2025-12-31', 150000.00, 'Y'),
(1, 2, '2015-06-01', '2024-12-31', 200000.00, 'Y'),
(4, 3, '2018-01-01', '2026-12-31', 180000.00, 'Y'),
(1, 4, '2007-01-01', '2014-12-31', 120000.00, 'N'),
(2, 5, '2017-01-01', '2024-12-31', 160000.00, 'N'),
(4, 6, '2019-01-01', '2025-12-31', 140000.00, 'Y'),
(1, 7, '2019-01-01', '2026-12-31', 175000.00, 'Y'),
(1, 8, '2022-01-01', '2027-12-31', 185000.00, 'Y'),
(2, 9, '2023-01-01', '2028-12-31', 220000.00, 'Y'),
(2, 10, '2022-01-01', '2027-12-31', 250000.00, 'Y'),
(3, 11, '2019-01-01', '2025-12-31', 165000.00, 'Y'),
(1, 12, '2020-01-01', '2026-12-31', 155000.00, 'Y'),
(1, 13, '2022-01-01', '2027-12-31', 145000.00, 'Y'),
(1, 14, '2018-01-01', '2025-12-31', 195000.00, 'Y'),
(1, 15, '2017-01-01', '2023-12-31', 135000.00, 'N'),
(1, 16, '2021-01-01', '2026-12-31', 190000.00, 'Y'),
(1, 17, '2017-01-01', '2023-12-31', 125000.00, 'N'),
(2, 18, '2013-01-01', '2023-12-31', 145000.00, 'N'),
(1, 19, '2017-01-01', '2024-12-31', 168000.00, 'Y'),
(1, 20, '2019-01-01', '2025-12-31', 158000.00, 'Y'),
(1, 21, '2018-01-01', '2026-12-31', 142000.00, 'Y');

-- Insert Countries
INSERT INTO MSK_COUNTRY (SERIES_ID, PRODUCER_ID, COUNTRY_NAME) VALUES
(1, 'PROD001', 'United States'),
(2, 'PROD001', 'United Kingdom'),
(3, 'PROD002', 'United States'),
(4, 'PROD002', 'United States'),
(5, 'PROD003', 'United States'),
(6, 'PROD004', 'United States'),
(7, 'PROD005', 'United States'),
(8, 'PROD005', 'United States'),
(9, 'PROD006', 'United States'),
(10, 'PROD001', 'United States'),
(11, 'PROD006', 'United States'),
(12, 'PROD003', 'United Kingdom'),
(13, 'PROD007', 'United States'),
(14, 'PROD006', 'United States'),
(15, 'PROD002', 'United States'),
(16, 'PROD005', 'South Korea'),
(17, 'PROD007', 'Germany'),
(18, 'PROD001', 'United Kingdom'),
(19, 'PROD005', 'Spain'),
(20, 'PROD005', 'United States'),
(21, 'PROD004', 'United States');

-- Insert Series Types
INSERT INTO MSK_SERIES_TYPE (TYPE_NAME, SERIES_ID) VALUES
('Sci-Fi', 1),
('Horror', 1),
('Drama', 2),
('Historical', 2),
('Sci-Fi', 3),
('Action', 3),
('Crime', 4),
('Drama', 4),
('Drama', 5),
('Comedy', 6),
('Sports', 6),
('Fantasy', 7),
('Action', 7),
('Comedy', 8),
('Horror', 8),
('Drama', 9),
('Horror', 9),
('Fantasy', 10),
('Drama', 10),
('Action', 11),
('Drama', 11),
('Romance', 12),
('Historical', 12),
('Comedy', 13),
('Drama', 13),
('Drama', 14),
('Crime', 14),
('Crime', 15),
('Drama', 15),
('Thriller', 16),
('Drama', 16),
('Sci-Fi', 17),
('Thriller', 17),
('Crime', 18),
('Historical', 18),
('Crime', 19),
('Thriller', 19),
('Sci-Fi', 20),
('Action', 20),
('Action', 21),
('Drama', 21);

-- Insert Dubbing Languages
INSERT INTO MSK_SERIES_DUBBING (SERIES_ID, DUBBING_LANGUAGE) VALUES
(1, 'Spanish'),
(1, 'French'),
(2, 'Spanish'),
(3, 'Spanish'),
(4, 'German'),
(5, 'French'),
(6, 'Spanish');

-- Insert Subtitle Languages
INSERT INTO MSK_SERIES_SUBTITLE (SERIES_ID, SUBTITLE_LANGUAGE) VALUES
(1, 'English'),
(1, 'Spanish'),
(1, 'French'),
(2, 'English'),
(3, 'English'),
(4, 'English'),
(5, 'English'),
(6, 'English');

-- Insert Producer-Production House relationships
INSERT INTO MSK_PROD_PROD_HOUSE (PRODUCER_ID, PROD_HOUSE_ID) VALUES
('PROD001', 1),
('PROD001', 2),
('PROD002', 1),
('PROD003', 1),
('PROD004', 4);

-- Insert Sample Viewer (password is 'password123' hashed with bcrypt)
-- Admin and Employee users for content management
INSERT INTO MSK_VIEWER (SERIES_ID, COUNTRY_ID, FIRST_NAME, LAST_NAME, EMAIL, PASSWORD_HASH, ROLE, BILLING_STREET, BILLING_CITY, BILLING_ZIPCODE, MONTHLY_FEE) VALUES
(1, 1, 'Admin', 'User', 'admin@msk.com', '$2a$10$YKccmj3l/AdMMkiwi1iUeu40z5rG93d9.vcf1k.iDAtqwbTUeNG/.', 'admin', '100 Admin Blvd', 'San Francisco', 94102, 14.99),
(1, 1, 'Employee', 'User', 'employee@msk.com', '$2a$10$YKccmj3l/AdMMkiwi1iUeu40z5rG93d9.vcf1k.iDAtqwbTUeNG/.', 'employee', '200 Staff Ave', 'San Francisco', 94103, 14.99),
(1, 1, 'John', 'Doe', 'john.doe@example.com', '$2a$10$YKccmj3l/AdMMkiwi1iUeu40z5rG93d9.vcf1k.iDAtqwbTUeNG/.', 'customer', '123 Main St', 'New York', 10001, 14.99),
(2, 2, 'Jane', 'Smith', 'jane.smith@example.com', '$2a$10$YKccmj3l/AdMMkiwi1iUeu40z5rG93d9.vcf1k.iDAtqwbTUeNG/.', 'customer', '456 Oak Ave', 'London', 12345, 12.99),
(3, 3, 'Mike', 'Johnson', 'mike.j@example.com', '$2a$10$YKccmj3l/AdMMkiwi1iUeu40z5rG93d9.vcf1k.iDAtqwbTUeNG/.', 'customer', '789 Elm St', 'Seattle', 98101, 15.99);

-- Insert Sample Feedback (viewer IDs: 1=admin, 2=employee, 3=john, 4=jane, 5=mike)
INSERT INTO MSK_FEEDBACK (VIEWER_ID, SERIES_ID, RATING, DATE, TEXT) VALUES
(3, 1, 4.5, '2024-01-15', 'Amazing show! Love the 80s vibe and the mystery.'),
(4, 2, 5.0, '2024-01-20', 'Best historical drama I have ever watched.'),
(5, 3, 4.8, '2024-02-10', 'Baby Yoda is adorable! Great story and visuals.');

-- Insert Sample Schedules
INSERT INTO MSK_SCHEDULE (EPISODE_ID, SERIES_ID, START_DATE, END_DATE, IS_CURRENT) VALUES
(1, 1, '2024-12-01', '2024-12-31', 'Y'),
(2, 1, '2024-12-01', '2024-12-31', 'Y'),
(3, 1, '2024-12-01', '2024-12-31', 'Y'),
(6, 2, '2024-12-01', '2024-12-31', 'Y'),
(10, 3, '2024-12-01', '2024-12-31', 'Y');
