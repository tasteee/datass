// dts-bundle-generator.config.js
// @ts-check

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
	entries: [
	  {
		filePath: './src/index.ts',
		outFile: './dist/datass.d.ts',
		noCheck: false
	  }
	]
  };
  
  module.exports = config;
  