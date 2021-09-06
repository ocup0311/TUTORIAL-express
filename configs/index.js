module.exports =
  process.env.NODE_ENV === 'production' && !process.env.STAGING
    ? require('./prod')
    : require('./dev')
