const express = require("express");

const app = express();

app.use(express.json());

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is Started");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertObjectToArrayObject = (objectData) => {
  return {
    stateId: objectData.state_id,
    stateName: objectData.state_name,
    population: objectData.population,
  };
};
const createObject = (eachState) => {
  return {
    stateName: eachState.state_name,
  };
};
app.get("/states/", async (request, response) => {
  const getQuery = `SELECT * FROM state ORDER BY state_id ASC`;
  const stateInfo = await db.all(getQuery);
  response.send(
    stateInfo.map((eachState) => convertObjectToArrayObject(eachState))
  );
});

// get a state based on stateID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `SELECT * 
  FROM state 
  WHERE 
  state_id = ${stateId}`;

  const getStateInfo = await db.get(getStateQuery);

  response.send({
    stateId: getStateInfo.state_id,
    stateName: getStateInfo.state_name,
    population: getStateInfo.population,
  });
});

// post the data based on given district id

app.post("/districts/", async (request, response) => {
  try {
    const bodyDetails = request.body;

    const { districtName, stateId, cases, cured, active, deaths } = bodyDetails;

    const createQuery = `INSERT INTO district 
        
        (district_name, state_id, cases, cured, active, deaths)
        
        VALUES (${districtName}, ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
         )`;

    const postTheData = await db.run(createQuery);

    const districtId = postTheData.lastId;

    response.send("District Successfully Added");
  } catch (e) {
    console.log(e.message);
  }
});

// get district based on given districtId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getQuery = `SELECT * 
    FROM district 
    WHERE 
    district_id = ${districtId}`;

  const getDistrictInfo = await db.get(getQuery);

  response.send({
    districtId: getDistrictInfo.district_id,
    districtName: getDistrictInfo.district_name,
    stateId: getDistrictInfo.state_id,
    cases: getDistrictInfo.cases,
    cured: getDistrictInfo.cured,
    active: getDistrictInfo.active,
    deaths: getDistrictInfo.deaths,
  });
});

//delete district from district table based on given districtId

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `DELETE 
     FROM district 
     WHERE 
     district_id = ${districtId}`;

  const deleteDistrictFromDistrictTable = await db.run(deleteQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  try {
    const bodyDetails = request.body;

    const { districtName, stateId, cases, cured, active, deaths } = bodyDetails;

    const updateDistrictQuery = `UPDATE 
        district SET 
        district_name = ${districtName},
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}`;

    const updateDistrictInDistrictTable = await db.run(updateDistrictQuery);

    response.send("District Details Updated");
  } catch (e) {
    console.log(e.message);
  }
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;

    const getStatsQuery = `SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
            FROM district 
            WHERE state_id = ${stateId}`;

    const statsReport = await db.get(getStatsQuery);

    response.send(statsReport);
  } catch (e) {
    console.log(e.message);
  }
});

// Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const stateDetails = `SELECT state_name 
  FROM state 
  JOIN district ON 
  state.state_id = district.state_id
   WHERE 
   district.district_id = ${districtId}`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});
module.exports = app;
