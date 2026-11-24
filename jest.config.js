// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  // Grafana 8's RxJS dependency exposes untransformed ESM under the browser condition.
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};
