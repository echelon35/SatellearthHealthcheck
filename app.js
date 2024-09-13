const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, './.env')});

const app = express();
const port = process.env.SATELLEARTH_HEALTHCHECK_PORT || 3000;

var allowedOrigins = ['http://localhost:4200'];

// Liste des APIs à vérifier en interne
const apis = [
  { name: 'SatellearthAPI', url: `${process.env.SATELLEARTH_API}/health` },
  { name: 'DisasterAPI', url: `${process.env.DISASTER_API}/health` },
//   { name: 'DisasterEater', url: `${process.env.DISASTER_EATER}/health` },
];

// Liste des APIs à vérifier
const externalapis = [
    { name: 'GDACS', url: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP` },
  ];

//Cors middleware
app.use(cors({
    origin: function(origin, callback){
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
                var msg = 'The CORS policy for this site does not ' +
                            'allow access from the specified Origin.';
                return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

// Fonction pour vérifier la santé d'une API
async function checkApiHealth(api) {
  try {
    const response = await axios.get(api.url, { timeout: 5000 });
    return { name: api.name, url: api.url, status: (response.data ? 'OK' : 'NOK'), responseTime: response.duration };
  } catch (error) {
    return { name: api.name, url: api.url, status: 'ERROR', message: error.message };
  }
}

// Route pour le healthcheck
app.get('/health', async (req, res) => {
  const results = await Promise.all(apis.map(checkApiHealth));
  const overallStatus = results.every(result => result.status === 'OK') ? 'OK' : 'ERROR';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    apis: results
  });
});

// Route pour le healthcheck
app.get('/health-external', async (req, res) => {
    const results = await Promise.all(externalapis.map(checkApiHealth));
    const overallStatus = results.every(result => result.status === 'OK') ? 'OK' : 'ERROR';
  
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      apis: results
    });
  });

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur de healthcheck démarré sur le port ${port}`);
});