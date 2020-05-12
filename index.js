const Koa = require('koa');
const serve = require('koa-static');
const logger = require('koa-logger');
const fs = require('fs');

const router = require('./src/router');
const config = require('./src/config');
const ssdp = require('./src/ssdp');
const cron = require('./src/cron');

// TODO: Figure out the discovery protocol UDP thing on port 65001
// Mainly, WHAT IS THAT YOU WANT PLEX?!

const app = new Koa();

try {
  app
    .use(logger())
    .use(router().routes())
    .use(router().allowedMethods())
    .use(serve('public', { extensions: true }))
    .use(async function pageNotFound(ctx) {
      ctx.status = 404;
      ctx.type = 'html';
      ctx.body = fs.createReadStream('public/404.html');
    });

  app.listen(5004);
  console.log(`📡  Antennas are deployed! Proxying from ${config().antennas_url}`);
  cron();
  ssdp();
} catch (e) {
  console.log('❌  Antennas failed to deploy! 😮  It could be missing a config file, or something is misconfigured. See below for details:');
  console.log(e);
}


