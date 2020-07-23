// import {transformSvelte} from "../parser/index.js"

const fs = require('fs');
const path = require('path');

export default function mySvelete() {
  return {
    name: 'my-svelte',
    resolveId(source, importer) {
      if (source.endsWith(".svelte")) {
        return path.join(path.dirname(importer), source)
      }
      return null
    },

    load(id) {
      let x = fs.readFileSync(id, "utf8")

      console.log("@@@@@@@@@@@@@@@@@@@@@@@", x)

      // return transformSvelte(x)
    }
  }
}