const fs = require("fs");

const path = require("path");
const _ = require("lodash");
const argv = require("minimist")(process.argv.slice(2));

// defaults
let config = {
  db: {
    pool: {
      min: 2,
      max: 10
    },
    schema: "auth",
    table: "users"
  },
  port: 3001,
  roles: {
    anonymous: "web_anon",
    user: "normal_user"
  }
};

mergeInConfigFile();
mergeInArguments();
mergeInEnvVars();
validateConfig();

module.exports = config;

//
// Helpers
//

function mergeInConfigFile() {
  // Merge config file
  if (argv.config || argv.c) {
    _.merge(config, require(path.resolve(process.cwd(), argv.config || argv.c)));
  } else if (fs.existsSync(path.resolve(process.cwd(), "postgrest-auth.json"))) {
    _.merge(config, require(path.resolve(process.cwd(), "postgrest-auth.json")));
  }
}

function mergeInArguments() {
  if (argv.app || argv.A) {
    config.app_name = argv.app || argv.a;
  }

  if (argv.connection || argv.C) {
    config.db.connection_string = argv.connection || argv.C;
  }

  if (argv.schema || argv.s) {
    config.db.schema = argv.schema || argv.s;
  }

  if (argv.table || argv.t) {
    config.db.table = argv.db.table || argv.t;
  }

  if (argv.expire || argv.exp || argv.e) {
    config.payload.exp = argv.expire || argv.exp || argv.e;
  }

  if (argv.issuer || argv.iss || argv.i) {
    config.payload.iss = argv.issuer || argv.iss || argv.i;
  }

  if (argv.secret || argv.S) {
    config.secret = argv.secret || argv.S;
  }

  if (argv.port || argv.p) {
    config.port = argv.port || argv.p;
  }
}

function mergeInEnvVars() {
  const mappings = [
    { configPath: 'app_name', envVarName: 'APP_NAME' },
    { configPath: 'port', envVarName: 'PORT' },
    { configPath: 'secret', envVarName: 'SECRET' },

    { configPath: 'db.pool.min', envVarName: 'DB__POOL__MIN' },
    { configPath: 'db.pool.max', envVarName: 'DB__POOL__MAX' },
    { configPath: 'db.schema', envVarName: 'DB__SCHEMA' },
    { configPath: 'db.table', envVarName: 'DB__TABLE' },

    { configPath: 'db.connection.host', envVarName: 'DB__CONNECTION__HOST' },
    { configPath: 'db.connection.port', envVarName: 'DB__CONNECTION__PORT' },
    { configPath: 'db.connection.database', envVarName: 'DB__CONNECTION__DATABASE' },
    { configPath: 'db.connection.user', envVarName: 'DB__CONNECTION__USER' },
    { configPath: 'db.connection.password', envVarName: 'DB__CONNECTION__PASSWORD' },

    { configPath: 'db.connection_string', envVarName: 'DB__CONNECTION_STRING' },

    { configPath: 'email.from', envVarName: 'EMAIL__FROM' },
    { configPath: 'email.host', envVarName: 'EMAIL__HOST' },
    { configPath: 'email.port', envVarName: 'EMAIL__PORT' },
    { configPath: 'email.secure', envVarName: 'EMAIL__SECURE' },
    { configPath: 'email.auth.user', envVarName: 'EMAIL__AUTH__USER' },
    { configPath: 'email.auth.pass', envVarName: 'EMAIL__AUTH__PASS' },

    { configPath: 'payload.exp', envVarName: 'PAYLOAD__EXP' },
    { configPath: 'payload.iss', envVarName: 'PAYLOAD__ISS' },

    { configPath: 'roles.anonymous', envVarName: 'ROLES__ANONYMOUS' },
    { configPath: 'roles.user', envVarName: 'ROLES__USER' },
  ]

  for (const { configPath, envVarName } of mappings) {
    if (process.env[envVarName] !== undefined) {
      _.set(config, configPath, process.env[envVarName]);
    }
  }
}

// TODO: stop requireing all of them
function validateConfig () {
  const configKeys = [
    'app_name',
    'db.pool.min',
    'db.pool.max',
    'db.schema',
    'db.table',
    'email.from',
    'email.host',
    'email.port',
    'email.secure',
    'email.auth.user',
    'email.auth.pass',
    'payload.exp',
    'payload.iss',
    'port',
    'roles.anonymous',
    'secret',
  ]

  function configKey(key) {
    return _.get(config, key) === undefined
  }

  const dbConnectionObjectKeys = [
    'db.connection.host',
    'db.connection.port',
    'db.connection.database',
    'db.connection.user',
    'db.connection.password'
  ];

  if (!configKey('db.connection_string') && !(dbConnectionObjectKeys.every(a => configKey(a)))) {
    throw new Error('Config must include db.connection_string or all of the following:' + dbConnectionObjectKeys.join(', '));
  }

  const missingKeys = configKeys.reduce((acc, key) => {
    if (typeof _.get(config, key) === 'undefined') {
      acc.push(key);
    }
    return acc;
  }, [])

  if (missingKeys.length > 0) {
    throw new Error('Config is missing the following values: ' + missingKeys.join(', '));
  }

  const numMin = parseInt(config.db.pool.min, 10);
  const numMax = parseInt(config.db.pool.max, 10);
  const numPort = parseInt(config.port, 10);
  const numExp = parseInt(config.payload.exp, 10);

  config.db.pool.max = numMax;
  config.db.pool.min = numMin;
  config.port = numPort;
  config.payload.exp = numExp;


  if (isNaN(numMin) || isNaN(numMax) || isNaN(numPort)) {
    throw new Error(`db.pool.min, db.pool.max, and port must all be numbers`);
  }

}
