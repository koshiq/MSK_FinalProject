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
('PROD004', 'Greg', 'Daniels', 'New York', 'NY', 'gdaniels@example.com', '555-0104');

-- Insert Web Series
INSERT INTO MSK_WEB_SERIES (NAME, NUMBER_OF_EPISODES, RELEASE_DATE, COUNTRY_OF_RELEASE, DESCRIPTION) VALUES
('Stranger Things', 42, '2016-07-15', 'United States', 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.'),
('The Crown', 60, '2016-11-04', 'United Kingdom', 'Follows the political rivalries and romance of Queen Elizabeth II''s reign.'),
('The Mandalorian', 24, '2019-11-12', 'United States', 'The travels of a lone bounty hunter in the outer reaches of the galaxy.'),
('Breaking Bad', 62, '2008-01-20', 'United States', 'A chemistry teacher diagnosed with cancer turns to cooking meth.'),
('Succession', 39, '2018-06-03', 'United States', 'The Roy family fights for control of their media empire.'),
('Ted Lasso', 34, '2020-08-14', 'United States', 'American football coach hired to manage a British soccer team.');

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

-- Insert Contracts
INSERT INTO MSK_CONTRACTS (PROD_HOUSE_ID, SERIES_ID, START_DATE, END_DATE, RATE_PER_EPISODE, IS_RENEWED) VALUES
(1, 1, '2015-01-01', '2025-12-31', 150000.00, 'Y'),
(1, 2, '2015-06-01', '2024-12-31', 200000.00, 'Y'),
(4, 3, '2018-01-01', '2026-12-31', 180000.00, 'Y'),
(1, 4, '2007-01-01', '2014-12-31', 120000.00, 'N'),
(2, 5, '2017-01-01', '2024-12-31', 160000.00, 'N'),
(4, 6, '2019-01-01', '2025-12-31', 140000.00, 'Y');

-- Insert Countries
INSERT INTO MSK_COUNTRY (SERIES_ID, PRODUCER_ID, COUNTRY_NAME) VALUES
(1, 'PROD001', 'United States'),
(2, 'PROD001', 'United Kingdom'),
(3, 'PROD002', 'United States'),
(4, 'PROD002', 'United States'),
(5, 'PROD003', 'United States'),
(6, 'PROD004', 'United States');

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
('Sports', 6);

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
