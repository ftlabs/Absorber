const dotenv = require('dotenv').config();
require('./bin/lib/minimum-server');

const interval = process.env.ABSORB_INTERVAL || (1000 * 60) * 2;
const absorber = require('./bin/lib/absorb.js');

absorber.poll(interval, true);
