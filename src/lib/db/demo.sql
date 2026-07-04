/* eslint-disable */
// Auto-generated full schema + seed dump, used to bootstrap a fresh SQLite on
// Vercel cold starts (and on a clean local checkout that deleted data/canvass.db).
// Regenerate after reseeding locally:
//   pnpm seed
//   python3 scripts/dump-demo-data.py

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`street` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`geocoded_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
INSERT INTO addresses VALUES(1,40.04359525216409566,-105.2830189908911223,'4758 Norwood Ave','Boulder','CO','80302',1782913995,1782913995);
INSERT INTO addresses VALUES(2,40.00801560058430084,-105.2618390436764457,'935 26th St','Boulder','CO','80302',1782913996,1782913996);
INSERT INTO addresses VALUES(3,40.01638251076099095,-105.2750899389014734,'268 15th St','Boulder','CO','80302',1782913997,1782913997);
INSERT INTO addresses VALUES(4,40.02103441012019402,-105.2958502543704639,'3154 Sunshine Canyon Dr','Boulder','CO','80302',1782914000,1782914000);
INSERT INTO addresses VALUES(5,40.01144618267768038,-105.2592188482425399,'254 28th St','Boulder','CO','80302',1782914001,1782914001);
INSERT INTO addresses VALUES(6,40.04354283174647832,-105.2854102752783376,'4317 Wonderland Ave','Boulder','CO','80302',1782914003,1782914003);
INSERT INTO addresses VALUES(7,39.98631004145938306,-105.23970518567522,'1881 Table Mesa Dr','Boulder','CO','80302',1782914004,1782914004);
INSERT INTO addresses VALUES(8,40.01753370005972955,-105.2721461409667256,'1209 17th St','Boulder','CO','80302',1782914005,1782914005);
INSERT INTO addresses VALUES(9,40.05164530370844034,-105.2320519635306227,'3245 Dillon Rd','Boulder','CO','80302',1782914007,1782914007);
INSERT INTO addresses VALUES(10,40.01961369481363561,-105.2719794857410704,'3490 19th St','Boulder','CO','80302',1782914008,1782914008);
INSERT INTO addresses VALUES(11,40.01952923341777079,-105.2720983952073795,'3262 Pearl St','Boulder','CO','80302',1782914009,1782914009);
INSERT INTO addresses VALUES(12,40.07239556799797952,-105.1934762020278101,'4279 Lookout Rd','Boulder','CO','80302',1782914011,1782914011);
INSERT INTO addresses VALUES(13,39.98602830677759101,-105.2399575226791626,'1861 Table Mesa Dr','Boulder','CO','80302',1782914012,1782914012);
INSERT INTO addresses VALUES(14,40.01968044481660058,-105.2791409798944783,'2758 13th St','Boulder','CO','80302',1782914013,1782914013);
INSERT INTO addresses VALUES(15,39.99969190197074909,-105.2342271505977748,'2629 Baseline Rd','Boulder','CO','80302',1782914015,1782914015);
INSERT INTO addresses VALUES(16,40.02517755035341906,-105.2721723521214017,'3097 20th St','Boulder','CO','80302',1782914016,1782914016);
INSERT INTO addresses VALUES(17,40.01327178269091433,-105.2980917691115224,'1935 Boulder Canyon Dr','Boulder','CO','80302',1782914017,1782914017);
INSERT INTO addresses VALUES(18,40.00001871697643452,-105.2345983073943074,'2121 Baseline Rd','Boulder','CO','80302',1782914020,1782914020);
INSERT INTO addresses VALUES(19,40.00773351736390281,-105.2816240492436038,'1664 College Ave','Boulder','CO','80302',1782914021,1782914021);
INSERT INTO addresses VALUES(20,40.06125291791016708,-105.2819446762923974,'4741 Lee Hill Dr','Boulder','CO','80302',1782914023,1782914023);
INSERT INTO addresses VALUES(21,40.00849749283830193,-105.2613787536980965,'3509 26th St','Boulder','CO','80302',1782914024,1782914024);
INSERT INTO addresses VALUES(22,40.0000053129144817,-105.2347115121925612,'3520 Baseline Rd','Boulder','CO','80302',1782914026,1782914026);
INSERT INTO addresses VALUES(23,40.00696014100046228,-105.2761426741900408,'376 Maple St','Boulder','CO','80302',1782914027,1782914027);
INSERT INTO addresses VALUES(24,40.07308850493843267,-105.1934107646100784,'820 Lookout Rd','Boulder','CO','80302',1782914028,1782914028);
INSERT INTO addresses VALUES(25,40.00851105868427738,-105.2616492366528149,'500 26th St','Boulder','CO','80302',1782914030,1782914030);
INSERT INTO addresses VALUES(26,40.00735112101232715,-105.2819392708396152,'2731 College Ave','Boulder','CO','80302',1782914031,1782914031);
INSERT INTO addresses VALUES(27,40.02048709313353215,-105.2957801849711785,'4103 Sunshine Canyon Dr','Boulder','CO','80302',1782914033,1782914033);
INSERT INTO addresses VALUES(28,40.01948034996070192,-105.2788908979489974,'2118 13th St','Boulder','CO','80302',1782914034,1782914034);
INSERT INTO addresses VALUES(29,40.06143425934331503,-105.282547057677803,'3359 Lee Hill Dr','Boulder','CO','80302',1782914035,1782914035);
INSERT INTO addresses VALUES(30,40.01898050570915189,-105.2535213619900532,'1627 30th St','Boulder','CO','80302',1782914037,1782914037);
INSERT INTO addresses VALUES(31,40.01852670000000244,-105.2752770000000026,'1500 Pearl St','Boulder','CO','80302',1782914102,1782914102);
INSERT INTO addresses VALUES(32,40.02256239999999821,-105.2815611000000046,'2500 Broadway','Boulder','CO','80302',1782914102,1782914102);
INSERT INTO addresses VALUES(33,40.03406809999999894,-105.257369600000004,'3300 28th St','Boulder','CO','80302',1782914102,1782914102);
INSERT INTO addresses VALUES(34,40.01664699999999897,-105.2804320000000046,'425 Walnut St','Boulder','CO','80302',1782914102,1782914102);
INSERT INTO addresses VALUES(35,40.00933529999999649,-105.266069900000005,'510 Folsom St','Boulder','CO','80302',1782914103,1782914103);
CREATE TABLE `imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text
);
INSERT INTO imports VALUES(1,'test-import.csv',1782914101,5,'complete',NULL);
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`age` integer,
	`party` text,
	`source` text,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO people VALUES(1,1,'Charlie','Mills',71,'DEM','seed:faker');
INSERT INTO people VALUES(2,1,'Cortney','Gutmann',57,'UNA','seed:faker');
INSERT INTO people VALUES(3,1,'Brionna','Klocko',77,'DEM','seed:faker');
INSERT INTO people VALUES(4,2,'Presley','Paucek',51,'DEM','seed:faker');
INSERT INTO people VALUES(5,3,'Elwyn','Denesik',90,'LIB','seed:faker');
INSERT INTO people VALUES(6,3,'Laron','Dietrich',22,'REP','seed:faker');
INSERT INTO people VALUES(7,3,'Rosemarie','Littel',29,'GRE','seed:faker');
INSERT INTO people VALUES(8,3,'Nova','Schultz',71,'LIB','seed:faker');
INSERT INTO people VALUES(9,4,'Flora','Torphy',53,'DEM','seed:faker');
INSERT INTO people VALUES(10,4,'Keara','Ledner',50,'DEM','seed:faker');
INSERT INTO people VALUES(11,5,'Susie','Roob',35,'DEM','seed:faker');
INSERT INTO people VALUES(12,5,'Teresa','Swaniawski',78,'DEM','seed:faker');
INSERT INTO people VALUES(13,5,'Rodney','Brown',35,'UNA','seed:faker');
INSERT INTO people VALUES(14,6,'Darrell','Weissnat',42,'UNA','seed:faker');
INSERT INTO people VALUES(15,7,'Jerome','Bashirian',64,'UNA','seed:faker');
INSERT INTO people VALUES(16,7,'Susie','Kuhn',91,'REP','seed:faker');
INSERT INTO people VALUES(17,7,'Dashawn','Nader',65,'UNA','seed:faker');
INSERT INTO people VALUES(18,7,'Emmie','McLaughlin',69,'DEM','seed:faker');
INSERT INTO people VALUES(19,8,'Gilda','Heaney',27,'GRE','seed:faker');
INSERT INTO people VALUES(20,8,'Marvin','Lehner',36,'DEM','seed:faker');
INSERT INTO people VALUES(21,8,'Lisandro','Reinger',85,'GRE','seed:faker');
INSERT INTO people VALUES(22,9,'Lazaro','Olson',19,'DEM','seed:faker');
INSERT INTO people VALUES(23,10,'Darwin','O''Hara',81,'LIB','seed:faker');
INSERT INTO people VALUES(24,10,'Frederick','Wiza',48,'GRE','seed:faker');
INSERT INTO people VALUES(25,10,'Jessy','Dietrich',72,'REP','seed:faker');
INSERT INTO people VALUES(26,11,'Tavares','Ward',50,'GRE','seed:faker');
INSERT INTO people VALUES(27,12,'Emil','Weber',70,'UNA','seed:faker');
INSERT INTO people VALUES(28,12,'Zachery','Terry',73,'LIB','seed:faker');
INSERT INTO people VALUES(29,13,'Samanta','Kuvalis',78,'LIB','seed:faker');
INSERT INTO people VALUES(30,13,'Shyann','Botsford',61,'DEM','seed:faker');
INSERT INTO people VALUES(31,14,'Alonzo','Champlin',57,'LIB','seed:faker');
INSERT INTO people VALUES(32,14,'Armani','Lindgren',66,'LIB','seed:faker');
INSERT INTO people VALUES(33,15,'Howard','Windler',80,'LIB','seed:faker');
INSERT INTO people VALUES(34,15,'Cecilia','Rau',67,'REP','seed:faker');
INSERT INTO people VALUES(35,16,'Olivia','Bayer',22,'GRE','seed:faker');
INSERT INTO people VALUES(36,16,'Bobby','Dach',51,'REP','seed:faker');
INSERT INTO people VALUES(37,17,'Maci','Nitzsche',20,'UNA','seed:faker');
INSERT INTO people VALUES(38,17,'Gerard','Lockman',88,'REP','seed:faker');
INSERT INTO people VALUES(39,17,'Clemmie','Auer',25,'LIB','seed:faker');
INSERT INTO people VALUES(40,18,'Tom','Rolfson',74,'DEM','seed:faker');
INSERT INTO people VALUES(41,18,'Ronnie','Hudson',19,'GRE','seed:faker');
INSERT INTO people VALUES(42,19,'Lyle','Harber',68,'LIB','seed:faker');
INSERT INTO people VALUES(43,19,'Asha','Lowe',51,'GRE','seed:faker');
INSERT INTO people VALUES(44,19,'Carolyn','Bradtke',25,'LIB','seed:faker');
INSERT INTO people VALUES(45,19,'Maximo','Yost',46,'REP','seed:faker');
INSERT INTO people VALUES(46,20,'Benny','Kassulke',86,'DEM','seed:faker');
INSERT INTO people VALUES(47,20,'Juanita','Carroll',67,'LIB','seed:faker');
INSERT INTO people VALUES(48,20,'Garnett','Fadel',90,'DEM','seed:faker');
INSERT INTO people VALUES(49,20,'Stephen','Bins-Lueilwitz',90,'UNA','seed:faker');
INSERT INTO people VALUES(50,21,'Stefan','Wiegand',84,'UNA','seed:faker');
INSERT INTO people VALUES(51,21,'Cody','McDermott',24,'GRE','seed:faker');
INSERT INTO people VALUES(52,22,'Marianna','Senger',89,'LIB','seed:faker');
INSERT INTO people VALUES(53,22,'Tomas','Balistreri',46,'GRE','seed:faker');
INSERT INTO people VALUES(54,22,'Leon','Spinka-Smitham',53,'UNA','seed:faker');
INSERT INTO people VALUES(55,23,'Zita','Welch',81,'REP','seed:faker');
INSERT INTO people VALUES(56,23,'Valerie','Osinski',64,'REP','seed:faker');
INSERT INTO people VALUES(57,23,'Josue','Stehr',59,'UNA','seed:faker');
INSERT INTO people VALUES(58,23,'Carl','Mraz',71,'REP','seed:faker');
INSERT INTO people VALUES(59,24,'Josephine','Harber',65,'REP','seed:faker');
INSERT INTO people VALUES(60,24,'Candace','Nitzsche',32,'REP','seed:faker');
INSERT INTO people VALUES(61,24,'Matthew','Bauch',31,'REP','seed:faker');
INSERT INTO people VALUES(62,24,'Brittany','Hickle',56,'LIB','seed:faker');
INSERT INTO people VALUES(63,25,'Duane','Denesik',34,'REP','seed:faker');
INSERT INTO people VALUES(64,25,'Friedrich','Bashirian',37,'LIB','seed:faker');
INSERT INTO people VALUES(65,25,'Jordan','Lemke',36,'REP','seed:faker');
INSERT INTO people VALUES(66,25,'Felicia','Carter',84,'UNA','seed:faker');
INSERT INTO people VALUES(67,26,'Caleb','O''Connell',61,'REP','seed:faker');
INSERT INTO people VALUES(68,26,'Darwin','Franecki',30,'DEM','seed:faker');
INSERT INTO people VALUES(69,26,'Stacy','Jenkins',91,'DEM','seed:faker');
INSERT INTO people VALUES(70,27,'Toney','Goyette',75,'DEM','seed:faker');
INSERT INTO people VALUES(71,27,'Kelley','Monahan',40,'UNA','seed:faker');
INSERT INTO people VALUES(72,28,'Virgie','Wehner',32,'DEM','seed:faker');
INSERT INTO people VALUES(73,28,'Russell','Douglas',31,'DEM','seed:faker');
INSERT INTO people VALUES(74,29,'Godfrey','Hodkiewicz',53,'REP','seed:faker');
INSERT INTO people VALUES(75,29,'Daryl','Little',86,'LIB','seed:faker');
INSERT INTO people VALUES(76,29,'Liliana','Schimmel',64,'UNA','seed:faker');
INSERT INTO people VALUES(77,30,'Kevin','Heaney',79,'DEM','seed:faker');
INSERT INTO people VALUES(78,31,'Avery','Quinn',34,'DEM','import:test-import.csv');
INSERT INTO people VALUES(79,32,'Riley','Morgan',55,'UNA','import:test-import.csv');
INSERT INTO people VALUES(80,33,'Sam','Patel',28,'REP','import:test-import.csv');
INSERT INTO people VALUES(81,34,'Jordan','Lee',41,'GRE','import:test-import.csv');
INSERT INTO people VALUES(82,35,'Casey','Smith',67,'UNA','import:test-import.csv');
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address_id` integer NOT NULL,
	`person_id` integer,
	`visited_at` integer DEFAULT (unixepoch()) NOT NULL,
	`home_status` text DEFAULT 'unknown' NOT NULL,
	`talked` integer DEFAULT false NOT NULL,
	`interested` integer,
	`notes` text,
	`contact_email` text,
	`contact_phone` text,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE set null
);
INSERT INTO visits VALUES(1,1,2,1782913995,'not_home',1,1,'Interested in volunteering',NULL,NULL);
INSERT INTO visits VALUES(2,3,8,1782913997,'home',0,NULL,NULL,NULL,NULL);
INSERT INTO visits VALUES(3,15,34,1782914015,'unknown',0,NULL,NULL,NULL,NULL);
INSERT INTO visits VALUES(4,16,36,1782914016,'not_home',0,NULL,NULL,NULL,NULL);
INSERT INTO visits VALUES(5,17,37,1782914017,'home',1,0,'Spoke for ~10 minutes about the issue',NULL,'821-768-7821');
INSERT INTO visits VALUES(6,23,55,1782914027,'home',1,0,'Wants more info via email','Sue62@hotmail.com',NULL);
INSERT INTO visits VALUES(7,24,59,1782914028,'unknown',0,NULL,NULL,NULL,NULL);
INSERT INTO visits VALUES(8,25,65,1782914030,'unknown',1,0,'Wants more info via email',NULL,NULL);
INSERT INTO visits VALUES(9,26,68,1782914031,'unknown',0,NULL,NULL,NULL,NULL);
INSERT INTO visits VALUES(10,27,70,1782914033,'not_home',1,0,'Not interested at this time',NULL,'410-938-2675');
INSERT INTO visits VALUES(11,29,76,1782914035,'unknown',0,NULL,NULL,NULL,NULL);
CREATE INDEX `address_geo_idx` ON `addresses` (`lat`,`lng`);
CREATE INDEX `people_address_idx` ON `people` (`address_id`);
CREATE INDEX `visits_address_idx` ON `visits` (`address_id`);
CREATE INDEX `visits_visited_at_idx` ON `visits` (`visited_at`);
COMMIT;
