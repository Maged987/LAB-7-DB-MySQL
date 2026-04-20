/**
 * Database lab — queries.js
 * ---------------------
 * Standalone script: connect to the same DB, run example aggregate SELECTs.
 * Run after you have submitted at least one CV via the web form:
 *   node queries.js
 *   npm run queries
 */

const { connectDb, getPool } = require("./db");

async function runQueries() {
  await connectDb();
  const pool = getPool();

  // Reset Data in DB
  await pool.query(`DELETE FROM training`);
  await pool.query(`DELETE FROM hobby`);
  await pool.query(`DELETE FROM language`);
  await pool.query(`DELETE FROM course`);
  await pool.query(`DELETE FROM project`);
  await pool.query(`DELETE FROM person`);

  // -------------- Insert default data to test
  // Basic data
  await pool.query(`INSERT INTO person (fName, lName, Address, city, country, Email) VALUES
    ('Maged', 'Abdelaziz', 'street 1', 'Cairo', 'Egypt', 'magedabdelaziz@email.com'),
    ('Ali', 'Mohamed', 'street 2', 'Giza', 'Egypt', 'alimohamed@email.com'),
    ('Ahmed', 'Omar', 'street 3', 'Aswan', 'Egypt', 'ahmedomar@email.com'),
    ('Sara', 'Ahmed', 'street 4', 'Riadh', 'Saudi Arabia', 'saraahmed@email.com'),
    ('Yousef', 'Mahmoud', 'street 5', 'Baris', 'France', 'yousefmahmoud@email.com'),
    ('Mai', 'Hani', 'street 6', 'NewYork', 'USA', 'maihani@email.com')`);

  const [persons] = await pool.query(`SELECT idperson FROM person`);
  const ids = persons.map((p) => p.idperson);
  // 3 courses each for first 3 persons
  for (const id of ids.slice(0, 3)) {
    await pool.query(
      `INSERT INTO course (name, person_idperson) VALUES ('Math',?),('Science',?),('History',?)`,
      [id, id, id],
    );
  }

  // projects for persons 2 3
  for (const id of ids.slice(2, 4)) {
    await pool.query(
      `INSERT INTO project (name, person_idperson) VALUES ('Project A', ?)`,
      [id],
    );
  }

  // 2 languages for first 3 persons
  for (const id of ids.slice(0, 4)) {
    await pool.query(
      `INSERT INTO language (name, person_idperson) VALUES ('Arabic',?),('English',?)`,
      [id, id],
    );
  }

  // 3 languages for last 3 persons
  for (const id of ids.slice(4)) {
    await pool.query(
      `INSERT INTO language (name, person_idperson) VALUES ('Arabic',?),('English',?),('France',?)`,
      [id, id, id],
    );
  }

  // —— QUERY 1: COUNT — how many courses per person (LEFT JOIN keeps people with 0 courses)
  console.log("\n── QUERY 1: Number of courses per person ──");

  const [courseCounts] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
    FROM person p
    LEFT JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    ORDER BY courseCount DESC
  `);

  courseCounts.forEach((row) =>
    console.log(`  ${row.fName} ${row.lName} → ${row.courseCount} course(s)`),
  );

  // —— QUERY 2: only persons with more than 1 project
  console.log("\n── QUERY 2: Persons with more than 1 project ──");

  const [topPerson] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(pr.idproject) AS projectCount
    FROM person p
    INNER JOIN project pr ON pr.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING projectCount > 1
    ORDER BY projectCount DESC
  `);

  if (topPerson.length > 0) {
    topPerson.forEach((t) =>
      console.log(`  ${t.fName} ${t.lName} — ${t.projectCount} project(s)`),
    );
  } else {
    console.log("  No data yet.");
  }

  // —— QUERY 3: DISTINCT — list unique countries in person table
  console.log("\n── QUERY 3: Unique countries ──");

  const [distinctCountries] = await pool.query(`
    SELECT DISTINCT country
    FROM person
    ORDER BY country ASC
  `);

  distinctCountries.forEach((row) => console.log(`  ${row.country || "N/A"}`));

  // —— QUERY 4: DELETE — remove persons with no city set
  // console.log('\n── QUERY 4: Delete persons with no city ──');

  // const [deleteResult] = await pool.query(`
  //   DELETE FROM person
  //   WHERE city IS NULL OR city = ''
  // `);

  // console.log(`  Deleted ${deleteResult.affectedRows} person(s) with no city.`);

  // —— QUERY 5: UPDATE — update email for person with id = 1
  console.log("\n── QUERY 5: Update email for person with id = 1 ──");

  const [updateResult] = await pool.query(`
  UPDATE person p SET p.email = 'test@updated.com' where p.idperson = 1 ;
`);
  console.log(`  Updated ${updateResult.affectedRows} person(s) email(s).`);

  // ======================================== TASK =============================================================
  // 1- Show persons who are enrolled in more than 2 courses, display their full name and course count
  console.log("\nPersons with more than 2 courses");
  const [task1] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(c.idcourse) AS course_count
    FROM person p
    JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING COUNT(c.idcourse) > 2
  `);
  console.table(task1);

  // 2- list each distinct country and the number of persons in it, only show countries with more than 2 persons
  console.log("\nCountries with more than 2 persons");
  const [task2] = await pool.query(`
    SELECT country, COUNT(*) AS person_count
    FROM person
    GROUP BY country
    HAVING COUNT(*) > 2
  `);
  console.table(task2);

  // 3- Update the email of all persons who have at least one project, set it to their firstName + lastName + '@company.com
  console.log("\nUpdate emails");
  await pool.query(`
    UPDATE person
    SET Email = CONCAT(fName, lName, '@company.com')
    WHERE idperson IN (
      SELECT DISTINCT person_idperson FROM project
    )
  `);
  const [task3] = await pool.query(`SELECT fName, lName, Email FROM person`);
  console.table(task3);

  // 4- Delete all courses that belong to persons from a specific country
  console.log("\nDelete courses of persons from Egypt");
  await pool.query(`
    DELETE FROM course
    WHERE person_idperson IN (
      SELECT idperson FROM person WHERE country = 'Egypt'
    )
  `);
  const [task4] = await pool.query(`SELECT * FROM course`);
  console.table(task4);

  // 5- Show each country and the average number of languages spoken by persons from that country, only show countries where the average is more than 1
  console.log("\nCountries with avg languages > 1");
  const [task5] = await pool.query(`
    SELECT p.country, AVG(lang_count) AS avg_languages
    FROM person p
    JOIN (
      SELECT person_idperson, COUNT(*) AS lang_count
      FROM language
      GROUP BY person_idperson
    ) l ON l.person_idperson = p.idperson
    GROUP BY p.country
    HAVING AVG(lang_count) > 1
  `);
  console.table(task5);

  await pool.end();
}

runQueries().catch((err) => console.error("Error:", err.message));
