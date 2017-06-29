const dotenv = require('dotenv').config();
require('./bin/lib/minimum-server');

const interval = process.env.ABSORB_INTERVAL || (1000 * 60) * 2;

require('./bin/lib/absorb.js').poll(interval, true);
