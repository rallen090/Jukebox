module.exports = {
  servers: {
    one: {
      // TODO: set host address, username, and authentication method
      host: 'ec2-35-167-240-82.us-west-2.compute.amazonaws.com',
      username: 'ubuntu',
      pem: '/Users/Ryan/Dev/jukebox-aws.pem'
      // password: 'server-password'
      // or neither for authenticate from ssh-agent
    }
  },

  app: {
    // TODO: change app name and path
    name: 'Jukebox',
    path: '/Users/Ryan/Dev/Jukebox/',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      // TODO: Change to your app's url
      // If you are using ssl, it needs to start with https://
      ROOT_URL: 'https://www.playjuke.com',
      MONGO_URL: 'mongodb://localhost/meteor',
    },

    ssl: { // (optional)
      crt: '/Users/Ryan/Dev/1_playjuke.com_bundle.crt', // this is a bundle of certificates
      key: '/Users/Ryan/Dev/Jukebox_SSL_CSR.key', // this is the private key of the certificate
      port: 443 // 443 is the default value and it's the standard HTTPS port
    },

    docker: {
      // change to 'abernix/meteord:base' if your app is using Meteor 1.4 - 1.5
      image: 'abernix/meteord:node-8.4.0-base',
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
